-- ==============================================================================
-- Med-Guard AI - Clinical Seed Data
-- Demonstrates realistic clinical scenarios:
-- 1. Patient with Penicillin allergy, CKD Stage 3, Hypertension, taking Lisinopril
-- 2. Patient with Atrial Fibrillation on Warfarin, Type 2 Diabetes on Metformin
-- ==============================================================================

-- Note: In production Supabase, data is tied to auth.users.
-- This seed script provides a helper function to seed data for any authenticated user.

CREATE OR REPLACE FUNCTION public.seed_sample_clinical_data(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    patient_one_id UUID;
    patient_two_id UUID;
    patient_three_id UUID;
BEGIN
    -- Patient 1: Eleanor Vance (71 y/o, CKD, HTN, Penicillin Allergy)
    INSERT INTO public.patients (user_id, full_name, date_of_birth, sex, height_cm, weight_kg, medical_notes)
    VALUES (
        target_user_id,
        'Eleanor Vance',
        '1953-04-12',
        'female',
        162.5,
        64.0,
        'Patient presents with moderate renal impairment (eGFR ~45 mL/min/1.73m2). Baseline BP moderately controlled.'
    ) RETURNING id INTO patient_one_id;

    -- Patient 1 Allergies
    INSERT INTO public.allergies (patient_id, allergen, reaction, severity, notes)
    VALUES 
        (patient_one_id, 'Penicillin', 'Hives, facial angioedema', 'severe', 'Diagnosed in 2012 following amoxicillin course'),
        (patient_one_id, 'Codeine', 'Severe nausea, dizziness', 'moderate', 'Intolerant to opioid derivatives');

    -- Patient 1 Conditions
    INSERT INTO public.medical_conditions (patient_id, condition_name, status, severity, diagnosis_date, notes)
    VALUES
        (patient_one_id, 'Chronic Kidney Disease (Stage 3a)', 'managed', 'moderate', '2020-09-15', 'Recent eGFR 48 mL/min'),
        (patient_one_id, 'Essential Hypertension', 'managed', 'moderate', '2015-02-10', 'Maintained on Lisinopril'),
        (patient_one_id, 'Osteoarthritis', 'active', 'mild', '2018-06-20', 'Knee and hip joint pain');

    -- Patient 1 Current Medications
    INSERT INTO public.medications (patient_id, name, generic_name, brand_name, strength, dosage_form, dose, frequency, route, start_date, active, prescribing_provider, notes)
    VALUES
        (patient_one_id, 'Lisinopril', 'lisinopril', 'Prinivil', '20 mg', 'Tablet', '20 mg', 'Once daily', 'Oral', '2015-03-01', TRUE, 'Dr. Sarah Jenkins', 'Hold if acute renal deterioration or hyperkalemia'),
        (patient_one_id, 'Acetaminophen', 'paracetamol', 'Tylenol', '500 mg', 'Tablet', '500 mg', 'Every 6 hours as needed', 'Oral', '2018-07-01', TRUE, 'Dr. Sarah Jenkins', 'First line for OA pain, max 2g/day');

    -- Patient 2: Arthur Pendelton (66 y/o, Afib, Type 2 DM, Warfarin therapy)
    INSERT INTO public.patients (user_id, full_name, date_of_birth, sex, height_cm, weight_kg, medical_notes)
    VALUES (
        target_user_id,
        'Arthur Pendelton',
        '1958-11-28',
        'male',
        178.0,
        88.5,
        'History of persistent atrial fibrillation on anticoagulation. High sensitivity to CYP2C9 interactions.'
    ) RETURNING id INTO patient_two_id;

    -- Patient 2 Allergies
    INSERT INTO public.allergies (patient_id, allergen, reaction, severity, notes)
    VALUES
        (patient_two_id, 'Sulfonamides (Sulfa drugs)', 'Maculopapular rash, pruritus', 'moderate', 'Erythema after Bactrim in 2017');

    -- Patient 2 Conditions
    INSERT INTO public.medical_conditions (patient_id, condition_name, status, severity, diagnosis_date, notes)
    VALUES
        (patient_two_id, 'Atrial Fibrillation', 'active', 'severe', '2019-01-14', 'CHA2DS2-VASc score = 3'),
        (patient_two_id, 'Type 2 Diabetes Mellitus', 'managed', 'moderate', '2012-05-18', 'HbA1c ~ 7.2%'),
        (patient_two_id, 'Hyperlipidemia', 'managed', 'mild', '2014-08-22', 'Target LDL < 70 mg/dL');

    -- Patient 2 Medications
    INSERT INTO public.medications (patient_id, name, generic_name, brand_name, strength, dosage_form, dose, frequency, route, start_date, active, prescribing_provider, notes)
    VALUES
        (patient_two_id, 'Warfarin Sodium', 'warfarin', 'Coumadin', '5 mg', 'Tablet', '5 mg', 'Once daily in evening', 'Oral', '2019-02-01', TRUE, 'Dr. Robert Chen', 'Target INR 2.0-3.0. Frequent monitoring required'),
        (patient_two_id, 'Metformin HCl', 'metformin', 'Glucophage', '1000 mg', 'Tablet', '1000 mg', 'Twice daily with meals', 'Oral', '2012-06-01', TRUE, 'Dr. Robert Chen', 'Renal function monitored biannually'),
        (patient_two_id, 'Atorvastatin', 'atorvastatin', 'Lipitor', '40 mg', 'Tablet', '40 mg', 'Once daily at bedtime', 'Oral', '2014-09-01', TRUE, 'Dr. Robert Chen', 'Lipid panel annual');

    -- Patient 3: Clara Oswald (29 y/o, Asthma, Depression, No known drug allergies)
    INSERT INTO public.patients (user_id, full_name, date_of_birth, sex, height_cm, weight_kg, medical_notes)
    VALUES (
        target_user_id,
        'Clara Oswald',
        '1995-08-14',
        'female',
        167.0,
        61.2,
        'Young adult female with moderate persistent asthma and major depressive disorder well controlled on SSRI.'
    ) RETURNING id INTO patient_three_id;

    -- Patient 3 Allergies
    INSERT INTO public.allergies (patient_id, allergen, reaction, severity, notes)
    VALUES
        (patient_three_id, 'Aspirin (NSAIDs)', 'Severe bronchospasm and urticaria', 'severe', 'Aspirin-exacerbated respiratory disease (AERD) triad');

    -- Patient 3 Conditions
    INSERT INTO public.medical_conditions (patient_id, condition_name, status, severity, diagnosis_date, notes)
    VALUES
        (patient_three_id, 'Asthma (Moderate persistent)', 'managed', 'moderate', '2008-03-12', 'Triggered by NSAIDs and cold air'),
        (patient_three_id, 'Major Depressive Disorder', 'in_remission', 'mild', '2021-10-04', 'Stable on Sertraline');

    -- Patient 3 Current Medications
    INSERT INTO public.medications (patient_id, name, generic_name, brand_name, strength, dosage_form, dose, frequency, route, start_date, active, prescribing_provider, notes)
    VALUES
        (patient_three_id, 'Sertraline HCl', 'sertraline', 'Zoloft', '50 mg', 'Tablet', '50 mg', 'Once daily in morning', 'Oral', '2021-10-15', TRUE, 'Dr. Emily Watson', 'Monitor for serotonin syndrome when adding serotonergic agents'),
        (patient_three_id, 'Albuterol Sulfate HFA', 'albuterol', 'ProAir HFA', '90 mcg/actuation', 'Inhaler', '2 puffs', 'Every 4-6 hours PRN wheezing', 'Inhalation', '2010-01-01', TRUE, 'Dr. Emily Watson', 'Rescue inhaler');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
