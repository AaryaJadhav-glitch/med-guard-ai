import { AllergyCreateSchema, AllergyUpdateSchema } from '../schemas/medical.schema.js';
import { logAuditEvent } from '../services/audit.service.js';

/**
 * Validates that patientId belongs to req.user.id
 */
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

export async function getAllergies(req, res, next) {
  try {
    const { patientId } = req.params;
    await verifyPatientAccess(req.supabase, patientId, req.user.id);

    const { data: allergies, error } = await req.supabase
      .from('allergies')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ allergies: allergies || [] });
  } catch (err) {
    next(err);
  }
}

export async function createAllergy(req, res, next) {
  try {
    const { patientId } = req.params;
    await verifyPatientAccess(req.supabase, patientId, req.user.id);
    const validatedData = AllergyCreateSchema.parse(req.body);

    const { data: allergy, error } = await req.supabase
      .from('allergies')
      .insert({
        patient_id: patientId,
        allergen: validatedData.allergen,
        reaction: validatedData.reaction,
        severity: validatedData.severity,
        notes: validatedData.notes
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'ALLERGY_ADDED',
      resourceType: 'allergy',
      resourceId: allergy.id,
      metadata: { patientId, allergen: allergy.allergen }
    });

    return res.status(201).json({ allergy });
  } catch (err) {
    next(err);
  }
}

export async function updateAllergy(req, res, next) {
  try {
    const { id } = req.params;
    const validatedData = AllergyUpdateSchema.parse(req.body);

    const updatePayload = {};
    if (validatedData.allergen !== undefined) updatePayload.allergen = validatedData.allergen;
    if (validatedData.reaction !== undefined) updatePayload.reaction = validatedData.reaction;
    if (validatedData.severity !== undefined) updatePayload.severity = validatedData.severity;
    if (validatedData.notes !== undefined) updatePayload.notes = validatedData.notes;

    const { data: allergy, error } = await req.supabase
      .from('allergies')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !allergy) {
      return res.status(404).json({ error: 'Allergy not found or update unauthorized.' });
    }

    return res.json({ allergy });
  } catch (err) {
    next(err);
  }
}

export async function deleteAllergy(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('allergies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'ALLERGY_DELETED',
      resourceType: 'allergy',
      resourceId: id
    });

    return res.json({ message: 'Allergy record removed successfully.' });
  } catch (err) {
    next(err);
  }
}
