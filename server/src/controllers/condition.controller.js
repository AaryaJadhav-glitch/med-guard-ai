import { ConditionCreateSchema, ConditionUpdateSchema } from '../schemas/medical.schema.js';
import { logAuditEvent } from '../services/audit.service.js';

async function verifyPatientAccess(supabase, patientId, userId) {
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    const err = new Error('Patient not found or unauthorized access.');
    err.status = 404;
    throw err;
  }
}

export async function getConditions(req, res, next) {
  try {
    const { patientId } = req.params;
    await verifyPatientAccess(req.supabase, patientId, req.user.id);

    const { data: conditions, error } = await req.supabase
      .from('medical_conditions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ conditions: conditions || [] });
  } catch (err) {
    next(err);
  }
}

export async function createCondition(req, res, next) {
  try {
    const { patientId } = req.params;
    await verifyPatientAccess(req.supabase, patientId, req.user.id);
    const validatedData = ConditionCreateSchema.parse(req.body);

    const { data: condition, error } = await req.supabase
      .from('medical_conditions')
      .insert({
        patient_id: patientId,
        condition_name: validatedData.conditionName,
        status: validatedData.status,
        severity: validatedData.severity,
        diagnosis_date: validatedData.diagnosisDate,
        notes: validatedData.notes
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'CONDITION_ADDED',
      resourceType: 'condition',
      resourceId: condition.id,
      metadata: { patientId, conditionName: condition.condition_name }
    });

    return res.status(201).json({ condition });
  } catch (err) {
    next(err);
  }
}

export async function updateCondition(req, res, next) {
  try {
    const { id } = req.params;
    const validatedData = ConditionUpdateSchema.parse(req.body);

    const updatePayload = {};
    if (validatedData.conditionName !== undefined) updatePayload.condition_name = validatedData.conditionName;
    if (validatedData.status !== undefined) updatePayload.status = validatedData.status;
    if (validatedData.severity !== undefined) updatePayload.severity = validatedData.severity;
    if (validatedData.diagnosisDate !== undefined) updatePayload.diagnosis_date = validatedData.diagnosisDate;
    if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes;

    const { data: condition, error } = await req.supabase
      .from('medical_conditions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !condition) {
      return res.status(404).json({ error: 'Condition not found or update unauthorized.' });
    }

    return res.json({ condition });
  } catch (err) {
    next(err);
  }
}

export async function deleteCondition(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('medical_conditions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'CONDITION_DELETED',
      resourceType: 'condition',
      resourceId: id
    });

    return res.json({ message: 'Medical condition record removed successfully.' });
  } catch (err) {
    next(err);
  }
}
