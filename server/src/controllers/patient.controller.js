import { PatientCreateSchema, PatientUpdateSchema } from '../schemas/patient.schema.js';
import { logAuditEvent } from '../services/audit.service.js';

export async function getPatients(req, res, next) {
  try {
    const { search } = req.query;
    let query = req.supabase
      .from('patients')
      .select('*, allergies(count), medical_conditions(count), medications(count)')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (search && search.trim()) {
      query = query.ilike('full_name', `%${search.trim()}%`);
    }

    const { data: patients, error } = await query;
    if (error) throw error;

    return res.json({ patients: patients || [] });
  } catch (err) {
    next(err);
  }
}

export async function createPatient(req, res, next) {
  try {
    const validatedData = PatientCreateSchema.parse(req.body);

    const { data: patient, error } = await req.supabase
      .from('patients')
      .insert({
        user_id: req.user.id,
        full_name: validatedData.fullName,
        date_of_birth: validatedData.dateOfBirth,
        sex: validatedData.sex,
        height_cm: validatedData.heightCm,
        weight_kg: validatedData.weightKg,
        medical_notes: validatedData.medicalNotes
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'PATIENT_CREATED',
      resourceType: 'patient',
      resourceId: patient.id,
      metadata: { patientName: patient.full_name }
    });

    return res.status(201).json({ patient });
  } catch (err) {
    next(err);
  }
}

export async function getPatientById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: patient, error } = await req.supabase
      .from('patients')
      .select(`
        *,
        allergies (*),
        medical_conditions (*),
        medications (*)
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !patient) {
      return res.status(404).json({ error: 'Patient not found or you do not have permission to access it.' });
    }

    return res.json({ patient });
  } catch (err) {
    next(err);
  }
}

export async function updatePatient(req, res, next) {
  try {
    const { id } = req.params;
    const validatedData = PatientUpdateSchema.parse(req.body);

    const updatePayload = {};
    if (validatedData.fullName !== undefined) updatePayload.full_name = validatedData.fullName;
    if (validatedData.dateOfBirth !== undefined) updatePayload.date_of_birth = validatedData.dateOfBirth;
    if (validatedData.sex !== undefined) updatePayload.sex = validatedData.sex;
    if (validatedData.heightCm !== undefined) updatePayload.height_cm = validatedData.heightCm;
    if (validatedData.weightKg !== undefined) updatePayload.weight_kg = validatedData.weightKg;
    if (validatedData.medicalNotes !== undefined) updatePayload.medical_notes = validatedData.medicalNotes;

    const { data: patient, error } = await req.supabase
      .from('patients')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !patient) {
      return res.status(404).json({ error: 'Patient not found or unable to update.' });
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'PATIENT_UPDATED',
      resourceType: 'patient',
      resourceId: patient.id
    });

    return res.json({ patient });
  } catch (err) {
    next(err);
  }
}

export async function deletePatient(req, res, next) {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('patients')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    await logAuditEvent({
      userId: req.user.id,
      action: 'PATIENT_DELETED',
      resourceType: 'patient',
      resourceId: id
    });

    return res.json({ message: 'Patient and all associated records deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function seedDemoPatients(req, res, next) {
  try {
    // Allows user to populate the standard clinical demonstration cases
    const samples = [
      {
        full_name: 'Eleanor Vance',
        date_of_birth: '1953-04-12',
        sex: 'female',
        height_cm: 162.5,
        weight_kg: 64.0,
        medical_notes: 'Stage 3a CKD (eGFR 48 mL/min). Baseline BP moderately controlled. High sensitivity to renal stressors.',
        allergies: [
          { allergen: 'Penicillin', reaction: 'Hives, facial angioedema', severity: 'severe', notes: 'Severe beta-lactam hypersensitivity' },
          { allergen: 'Codeine', reaction: 'Severe nausea and dizziness', severity: 'moderate', notes: 'Opioid intolerance' }
        ],
        conditions: [
          { condition_name: 'Chronic Kidney Disease (Stage 3a)', status: 'managed', severity: 'moderate', diagnosis_date: '2020-09-15', notes: 'Monitor renal panel' },
          { condition_name: 'Essential Hypertension', status: 'managed', severity: 'moderate', diagnosis_date: '2015-02-10', notes: 'Target BP < 130/80' },
          { condition_name: 'Osteoarthritis', status: 'active', severity: 'mild', diagnosis_date: '2018-06-20', notes: 'Bilateral knee pain' }
        ],
        medications: [
          { name: 'Lisinopril', generic_name: 'lisinopril', brand_name: 'Prinivil', strength: '20 mg', dosage_form: 'Tablet', dose: '20 mg', frequency: 'Once daily', route: 'Oral', start_date: '2015-03-01', active: true, prescribing_provider: 'Dr. Sarah Jenkins' },
          { name: 'Acetaminophen', generic_name: 'paracetamol', brand_name: 'Tylenol', strength: '500 mg', dosage_form: 'Tablet', dose: '500 mg', frequency: 'Every 6 hrs PRN', route: 'Oral', start_date: '2018-07-01', active: true, prescribing_provider: 'Dr. Sarah Jenkins' }
        ]
      },
      {
        full_name: 'Arthur Pendelton',
        date_of_birth: '1958-11-28',
        sex: 'male',
        height_cm: 178.0,
        weight_kg: 88.5,
        medical_notes: 'Persistent atrial fibrillation on chronic oral anticoagulation. Susceptible to CYP2C9 interactions.',
        allergies: [
          { allergen: 'Sulfonamides (Sulfa drugs)', reaction: 'Maculopapular rash, pruritus', severity: 'moderate', notes: 'Historical reaction to Bactrim' }
        ],
        conditions: [
          { condition_name: 'Atrial Fibrillation', status: 'active', severity: 'severe', diagnosis_date: '2019-01-14', notes: 'CHA2DS2-VASc = 3' },
          { condition_name: 'Type 2 Diabetes Mellitus', status: 'managed', severity: 'moderate', diagnosis_date: '2012-05-18', notes: 'HbA1c ~ 7.2%' }
        ],
        medications: [
          { name: 'Warfarin Sodium', generic_name: 'warfarin', brand_name: 'Coumadin', strength: '5 mg', dosage_form: 'Tablet', dose: '5 mg', frequency: 'Once daily in evening', route: 'Oral', start_date: '2019-02-01', active: true, prescribing_provider: 'Dr. Robert Chen' },
          { name: 'Metformin HCl', generic_name: 'metformin', brand_name: 'Glucophage', strength: '1000 mg', dosage_form: 'Tablet', dose: '1000 mg', frequency: 'Twice daily with meals', route: 'Oral', start_date: '2012-06-01', active: true, prescribing_provider: 'Dr. Robert Chen' }
        ]
      }
    ];

    for (const s of samples) {
      const { data: pt, error: ptErr } = await req.supabase
        .from('patients')
        .insert({
          user_id: req.user.id,
          full_name: s.full_name,
          date_of_birth: s.date_of_birth,
          sex: s.sex,
          height_cm: s.height_cm,
          weight_kg: s.weight_kg,
          medical_notes: s.medical_notes
        })
        .select()
        .single();

      if (ptErr) continue;

      if (s.allergies?.length) {
        await req.supabase.from('allergies').insert(s.allergies.map(a => ({ ...a, patient_id: pt.id })));
      }
      if (s.conditions?.length) {
        await req.supabase.from('medical_conditions').insert(s.conditions.map(c => ({ ...c, patient_id: pt.id })));
      }
      if (s.medications?.length) {
        await req.supabase.from('medications').insert(s.medications.map(m => ({ ...m, patient_id: pt.id })));
      }
    }

    return res.json({ message: 'Clinical demonstration cases loaded successfully into your account.' });
  } catch (err) {
    next(err);
  }
}
