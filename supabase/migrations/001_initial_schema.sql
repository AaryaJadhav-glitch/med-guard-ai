-- ==============================================================================
-- Med-Guard AI - Initial Database Schema & Security Policies
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Helper function for updated_at timestamps
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. Profiles Table (Linked to Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'healthcare_professional',
    organization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. Patients Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    sex TEXT CHECK (sex IN ('male', 'female', 'other', 'unknown')),
    height_cm NUMERIC CHECK (height_cm IS NULL OR height_cm > 0),
    weight_kg NUMERIC CHECK (weight_kg IS NULL OR weight_kg > 0),
    medical_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. Allergies Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    allergen TEXT NOT NULL,
    reaction TEXT,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening', 'unknown')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. Medical Conditions Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medical_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'managed', 'in_remission', 'resolved', 'historical')),
    severity TEXT DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe', 'critical', 'unspecified')),
    diagnosis_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. Medications Table (Patient's active & historical medication profile)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    generic_name TEXT,
    brand_name TEXT,
    strength TEXT,
    dosage_form TEXT,
    dose TEXT,
    frequency TEXT,
    route TEXT,
    start_date DATE,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    prescribing_provider TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. Analyses Table (AI Safety Reviews & Risk Evaluations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    overall_risk TEXT CHECK (overall_risk IN ('critical', 'high', 'moderate', 'low', 'informational')),
    summary TEXT,
    input_snapshot JSONB NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. Analysis Medications Table (M:N snapshot of medicines evaluated in analysis)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analysis_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    medication_type TEXT NOT NULL CHECK (medication_type IN ('existing', 'new')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. Audit Logs Table (Strict audit trail for clinical action tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients(full_name);
CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON public.allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_conditions_patient_id ON public.medical_conditions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON public.medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON public.medications(active);
CREATE INDEX IF NOT EXISTS idx_analyses_patient_id ON public.analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_overall_risk ON public.analyses(overall_risk);
CREATE INDEX IF NOT EXISTS idx_analysis_medications_analysis_id ON public.analysis_medications(analysis_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 11. Triggers for updated_at timestamps
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_patients_updated_at ON public.patients;
CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_medications_updated_at ON public.medications;
CREATE TRIGGER trg_medications_updated_at
    BEFORE UPDATE ON public.medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 12. Trigger to automatically create profile on auth.users sign up
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'healthcare_professional'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 13. Enable Row Level Security (RLS) on all tables
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 14. Row Level Security Policies
-- ==============================================================================

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Patients: Complete isolation by user_id
CREATE POLICY "Users can view own patients"
    ON public.patients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients"
    ON public.patients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients"
    ON public.patients FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients"
    ON public.patients FOR DELETE
    USING (auth.uid() = user_id);

-- Allergies: Must belong to a patient owned by auth.uid()
CREATE POLICY "Users can view allergies of own patients"
    ON public.allergies FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = allergies.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert allergies to own patients"
    ON public.allergies FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = allergies.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can update allergies of own patients"
    ON public.allergies FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = allergies.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete allergies of own patients"
    ON public.allergies FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = allergies.patient_id AND p.user_id = auth.uid()
    ));

-- Medical Conditions: Must belong to a patient owned by auth.uid()
CREATE POLICY "Users can view conditions of own patients"
    ON public.medical_conditions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medical_conditions.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert conditions to own patients"
    ON public.medical_conditions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medical_conditions.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can update conditions of own patients"
    ON public.medical_conditions FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medical_conditions.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete conditions of own patients"
    ON public.medical_conditions FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medical_conditions.patient_id AND p.user_id = auth.uid()
    ));

-- Medications: Must belong to a patient owned by auth.uid()
CREATE POLICY "Users can view medications of own patients"
    ON public.medications FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medications.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert medications to own patients"
    ON public.medications FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medications.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can update medications of own patients"
    ON public.medications FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medications.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete medications of own patients"
    ON public.medications FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = medications.patient_id AND p.user_id = auth.uid()
    ));

-- Analyses: user_id = auth.uid() and patient belongs to auth.uid()
CREATE POLICY "Users can view own analyses"
    ON public.analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = analyses.patient_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own analyses"
    ON public.analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
    ON public.analyses FOR DELETE
    USING (auth.uid() = user_id);

-- Analysis Medications: analysis belongs to auth.uid()
CREATE POLICY "Users can view analysis medications of own analyses"
    ON public.analysis_medications FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.analyses a
        WHERE a.id = analysis_medications.analysis_id AND a.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert analysis medications to own analyses"
    ON public.analysis_medications FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.analyses a
        WHERE a.id = analysis_medications.analysis_id AND a.user_id = auth.uid()
    ));

-- Audit Logs: user_id = auth.uid()
CREATE POLICY "Users can view own audit logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);
