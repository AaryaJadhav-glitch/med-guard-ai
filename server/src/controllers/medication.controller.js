import { MedicationCreateSchema, MedicationUpdateSchema } from '../schemas/medical.schema.js';
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

export async function getMedications(req, res, next) {
  try {
    const { patientId } = req.params;
    const { activeOnly } = req.query;
    await verifyPatientAccess(req.supabase, patientId, req.user.id);

    let query = req.supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .order('active', { ascending: false })
      .order('created_at', { ascending: false });

    if (activeOnly === 'true') {
      query = query.eq('active', true);
    }

    const { data: medications, error } = await query;
    if (error) throw error;

    return res.json({ medications: medications || [] });
  } catch (err) {
    next(err);
  }
}

export async function createMedication(req, res, next) {
  try {
    const { patientId } = req.params;
    await verifyPatientAccess(req.supabase, patientId, req.user.id);
    const validatedData = MedicationCreateSchema.parse(req.body);

    const { data: medication, error } = await req.supabase
      .from('medications')
      .insert({
        patient_id: patientId,
        name: validatedData.name,
        generic_name: validatedData.genericName,
        brand_name: validatedData.brandName,
        strength: validatedData.strength,
        dosage_form: validatedData.dosageForm,
        dose: validatedData.dose,
        frequency: validatedData.frequency,
        route: validatedData.route,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        active: validatedData.active,
        prescribing_provider: validatedData.prescribingProvider,
        notes: validatedData.notes
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'MEDICATION_ADDED',
      resourceType: 'medication',
      resourceId: medication.id,
      metadata: { patientId, medicationName: medication.name }
    });

    return res.status(201).json({ medication });
  } catch (err) {
    next(err);
  }
}

export async function updateMedication(req, res, next) {
  try {
    const { id } = req.params;
    const validatedData = MedicationUpdateSchema.parse(req.body);

    const updatePayload = {};
    if (validatedData.name !== undefined) updatePayload.name = validatedData.name;
    if (validatedData.genericName !== undefined) updatePayload.generic_name = validatedData.genericName;
    if (validatedData.brandName !== undefined) updatePayload.brand_name = validatedData.brandName;
    if (validatedData.strength !== undefined) updatePayload.strength = validatedData.strength;
    if (validatedData.dosageForm !== undefined) updatePayload.dosage_form = validatedData.dosageForm;
    if (validatedData.dose !== undefined) updatePayload.dose = validatedData.dose;
    if (validatedData.frequency !== undefined) updatePayload.frequency = validatedData.frequency;
    if (validatedData.route !== undefined) updatePayload.route = validatedData.route;
    if (validatedData.startDate !== undefined) updatePayload.start_date = validatedData.startDate;
    if (validatedData.endDate !== undefined) updatePayload.end_date = validatedData.endDate;
    if (validatedData.active !== undefined) updatePayload.active = validatedData.active;
    if (validatedData.prescribingProvider !== undefined) updatePayload.prescribing_provider = validatedData.prescribingProvider;
    if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes;

    const { data: medication, error } = await req.supabase
      .from('medications')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !medication) {
      return res.status(404).json({ error: 'Medication not found or update unauthorized.' });
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'MEDICATION_UPDATED',
      resourceType: 'medication',
      resourceId: medication.id
    });

    return res.json({ medication });
  } catch (err) {
    next(err);
  }
}

export async function deleteMedication(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('medications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'MEDICATION_DELETED',
      resourceType: 'medication',
      resourceId: id
    });

    return res.json({ message: 'Medication profile record deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
