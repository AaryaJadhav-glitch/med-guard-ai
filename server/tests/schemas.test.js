import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PatientCreateSchema } from '../src/schemas/patient.schema.js';
import { AllergyCreateSchema, ConditionCreateSchema, MedicationCreateSchema } from '../src/schemas/medical.schema.js';
import { AnalysisRequestSchema, AnalysisResponseSchema } from '../src/schemas/analysis.schema.js';

describe('Clinical Schema Validation Suite', () => {
  it('validates a valid patient creation payload', () => {
    const valid = {
      fullName: 'John Doe',
      dateOfBirth: '1980-05-15',
      sex: 'male',
      heightCm: 180,
      weightKg: 75.5,
      medicalNotes: 'No acute distress.'
    };
    const parsed = PatientCreateSchema.parse(valid);
    assert.strictEqual(parsed.fullName, 'John Doe');
    assert.strictEqual(parsed.sex, 'male');
  });

  it('rejects patient with invalid date of birth format', () => {
    const invalid = {
      fullName: 'Jane Doe',
      dateOfBirth: '15/05/1980'
    };
    assert.throws(() => PatientCreateSchema.parse(invalid));
  });

  it('validates allergy creation and assigns default severity', () => {
    const allergy = AllergyCreateSchema.parse({
      allergen: 'Amoxicillin',
      reaction: 'Urticaria'
    });
    assert.strictEqual(allergy.allergen, 'Amoxicillin');
    assert.strictEqual(allergy.severity, 'unknown');
  });

  it('validates medical condition schema and enforces enum statuses', () => {
    const condition = ConditionCreateSchema.parse({
      conditionName: 'Hypertension',
      status: 'active',
      severity: 'moderate'
    });
    assert.strictEqual(condition.conditionName, 'Hypertension');
    assert.throws(() => ConditionCreateSchema.parse({
      conditionName: 'Hypertension',
      status: 'invalid_status'
    }));
  });

  it('validates medication schema with dosage and frequency', () => {
    const med = MedicationCreateSchema.parse({
      name: 'Metformin',
      dose: '500 mg',
      frequency: 'Twice daily',
      route: 'Oral'
    });
    assert.strictEqual(med.active, true);
    assert.strictEqual(med.name, 'Metformin');
  });

  it('enforces clinical disclaimer acceptance on analysis request', () => {
    const payloadWithoutDisclaimer = {
      patientId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      newMedications: [{ name: 'Lisinopril', dose: '10mg' }],
      checks: {
        drugInteractions: true,
        allergies: true,
        contraindications: true,
        duplicateTherapy: true,
        doseConcerns: true,
        monitoring: true
      },
      disclaimerAccepted: false
    };
    assert.throws(() => AnalysisRequestSchema.parse(payloadWithoutDisclaimer));

    const validPayload = {
      ...payloadWithoutDisclaimer,
      disclaimerAccepted: true
    };
    assert.doesNotThrow(() => AnalysisRequestSchema.parse(validPayload));
  });

  it('validates structured AI safety response schema', () => {
    const response = {
      overallRisk: 'high',
      summary: 'Significant drug-interaction detected between Warfarin and Ibuprofen.',
      alerts: [
        {
          severity: 'critical',
          category: 'drug_interaction',
          title: 'Bleeding Risk Warning',
          medicationsInvolved: ['Warfarin', 'Ibuprofen'],
          explanation: 'Concurrent use inhibits platelet aggregation.',
          potentialConcern: 'Severe gastrointestinal bleeding.',
          recommendedClinicalAction: 'Consider alternative analgesic.',
          monitoring: ['INR', 'Hemoglobin'],
          possibleAlternatives: [
            {
              name: 'Acetaminophen',
              reason: 'Lower bleeding risk',
              caveats: 'Verify hepatic status'
            }
          ],
          confidence: 0.95,
          limitations: ['Dependent on patient adherence']
        }
      ],
      requiresProfessionalReview: true,
      dataLimitations: ['OTC medicines not reviewed']
    };
    const parsed = AnalysisResponseSchema.parse(response);
    assert.strictEqual(parsed.overallRisk, 'high');
    assert.strictEqual(parsed.alerts.length, 1);
    assert.strictEqual(parsed.alerts[0].category, 'drug_interaction');
  });
});
