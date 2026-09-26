import { AnalysisRequestSchema } from '../schemas/analysis.schema.js';
import { analyzeMedicationSafety } from '../services/gemini.service.js';
import { logAuditEvent } from '../services/audit.service.js';

export async function runAnalysis(req, res, next) {
  try {
    const validatedBody = AnalysisRequestSchema.parse(req.body);
    const { patientId, newMedications, checks } = validatedBody;

    // 1. Verify patient ownership and retrieve patient demographics
    const { data: patient, error: patientError } = await req.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('user_id', req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({
        error: 'Patient not found or you do not have permission to evaluate this patient.'
      });
    }

    // 2. Retrieve allergies, conditions, and active medications
    const [allergiesRes, conditionsRes, medicationsRes] = await Promise.all([
      req.supabase.from('allergies').select('*').eq('patient_id', patientId),
      req.supabase.from('medical_conditions').select('*').eq('patient_id', patientId),
      req.supabase.from('medications').select('*').eq('patient_id', patientId).eq('active', true)
    ]);

    const allergies = allergiesRes.data || [];
    const conditions = conditionsRes.data || [];
    const existingMedications = medicationsRes.data || [];

    // 3. Execute AI Safety Analysis via Gemini / Clinical Rules Engine
    const analysisResult = await analyzeMedicationSafety({
      patient,
      allergies,
      conditions,
      existingMedications,
      newMedications,
      checks
    });

    // 4. Persist analysis record
    const inputSnapshot = {
      patient: {
        id: patient.id,
        fullName: patient.full_name,
        dateOfBirth: patient.date_of_birth,
        sex: patient.sex,
        weightKg: patient.weight_kg,
        heightCm: patient.height_cm
      },
      allergiesCount: allergies.length,
      conditionsCount: conditions.length,
      existingMedications: existingMedications.map(m => m.name),
      newMedications: newMedications.map(m => m.name),
      checks
    };

    const { data: savedAnalysis, error: saveError } = await req.supabase
      .from('analyses')
      .insert({
        patient_id: patientId,
        user_id: req.user.id,
        status: 'completed',
        overall_risk: analysisResult.overallRisk,
        summary: analysisResult.summary,
        input_snapshot: inputSnapshot,
        result: analysisResult
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis record:', saveError.message);
      throw saveError;
    }

    // 5. Store snapshot of medications evaluated
    const medRecords = [
      ...existingMedications.map(m => ({
        analysis_id: savedAnalysis.id,
        medication_name: m.name,
        medication_type: 'existing'
      })),
      ...newMedications.map(nm => ({
        analysis_id: savedAnalysis.id,
        medication_name: nm.name,
        medication_type: 'new'
      }))
    ];

    if (medRecords.length > 0) {
      await req.supabase.from('analysis_medications').insert(medRecords);
    }

    // 6. Record audit event
    await logAuditEvent({
      userId: req.user.id,
      action: 'SAFETY_ANALYSIS_PERFORMED',
      resourceType: 'analysis',
      resourceId: savedAnalysis.id,
      metadata: {
        patientId,
        overallRisk: analysisResult.overallRisk,
        alertCount: analysisResult.alerts.length,
        newMedicationCount: newMedications.length
      }
    });

    return res.status(201).json({
      analysisId: savedAnalysis.id,
      patientId: savedAnalysis.patient_id,
      createdAt: savedAnalysis.created_at,
      overallRisk: analysisResult.overallRisk,
      summary: analysisResult.summary,
      result: analysisResult,
      patient: {
        id: patient.id,
        fullName: patient.full_name
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyses(req, res, next) {
  try {
    const { patientId, risk, limit = 50 } = req.query;

    let query = req.supabase
      .from('analyses')
      .select(`
        id,
        patient_id,
        user_id,
        status,
        overall_risk,
        summary,
        input_snapshot,
        result,
        created_at,
        patients (id, full_name, date_of_birth, sex)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    if (risk) {
      query = query.eq('overall_risk', risk);
    }

    const { data: analyses, error } = await query;
    if (error) throw error;

    return res.json({ analyses: analyses || [] });
  } catch (err) {
    next(err);
  }
}

export async function getAnalysisById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: analysis, error } = await req.supabase
      .from('analyses')
      .select(`
        *,
        patients (*),
        analysis_medications (*)
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !analysis) {
      return res.status(404).json({ error: 'Analysis not found or unauthorized access.' });
    }

    return res.json({ analysis });
  } catch (err) {
    next(err);
  }
}
