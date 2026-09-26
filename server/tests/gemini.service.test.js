import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge, buildClinicalContext, analyzeMedicationSafety } from '../src/services/gemini.service.js';

describe('Clinical AI Safety Engine Service', () => {
  it('accurately calculates patient age from ISO date string', () => {
    const age = calculateAge('1980-01-01');
    assert.strictEqual(typeof age, 'number');
    assert.ok(age > 40);

    assert.strictEqual(calculateAge(null), null);
    assert.strictEqual(calculateAge('invalid-date'), null);
  });

  it('builds de-identified clinical context payload without PII', () => {
    const rawData = {
      patient: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        full_name: 'Jane Doe', // Should not be in clinical payload
        date_of_birth: '1970-06-15',
        sex: 'female',
        weight_kg: 68.5,
        height_cm: 165
      },
      allergies: [{ allergen: 'Penicillin', reaction: 'Anaphylaxis', severity: 'severe' }],
      conditions: [{ condition_name: 'Asthma', status: 'active', severity: 'moderate' }],
      existingMedications: [{ name: 'Albuterol', dose: '90mcg', active: true }],
      newMedications: [{ name: 'Aspirin', dose: '325mg' }],
      checks: { drugInteractions: true, allergies: true, contraindications: true }
    };

    const context = buildClinicalContext(rawData);
    assert.ok(context.patient.age !== null);
    assert.strictEqual(context.patient.sex, 'female');
    assert.strictEqual(context.patient.full_name, undefined); // Verify PII stripped
    assert.strictEqual(context.newMedications[0].name, 'Aspirin');
  });

  it('detects severe allergy conflicts deterministically', async () => {
    const payload = {
      patient: {
        id: 'test-pt',
        date_of_birth: '1960-01-01',
        sex: 'male',
        weight_kg: 80,
        height_cm: 175
      },
      allergies: [{ allergen: 'Penicillin', reaction: 'Angioedema', severity: 'severe' }],
      conditions: [{ condition_name: 'Hypertension', status: 'managed', severity: 'mild' }],
      existingMedications: [{ name: 'Amlodipine', dose: '5mg', active: true }],
      newMedications: [{ name: 'Amoxicillin', dose: '500mg' }],
      checks: {
        drugInteractions: true,
        allergies: true,
        contraindications: true,
        duplicateTherapy: true,
        doseConcerns: true,
        monitoring: true
      }
    };

    const result = await analyzeMedicationSafety(payload);
    assert.strictEqual(result.overallRisk, 'critical');
    const allergyAlert = result.alerts.find(a => a.category === 'allergy');
    assert.ok(allergyAlert);
    assert.ok(allergyAlert.medicationsInvolved.includes('Amoxicillin'));
    assert.strictEqual(result.requiresProfessionalReview, true);
  });

  it('detects drug-drug interaction between Warfarin and NSAID', async () => {
    const payload = {
      patient: {
        id: 'test-pt-2',
        date_of_birth: '1955-03-20',
        sex: 'female',
        weight_kg: 70
      },
      allergies: [],
      conditions: [{ condition_name: 'Atrial Fibrillation', status: 'active', severity: 'severe' }],
      existingMedications: [{ name: 'Warfarin Sodium', dose: '5mg', active: true }],
      newMedications: [{ name: 'Ibuprofen', dose: '400mg' }],
      checks: {
        drugInteractions: true,
        allergies: true,
        contraindications: true,
        duplicateTherapy: true,
        doseConcerns: true,
        monitoring: true
      }
    };

    const result = await analyzeMedicationSafety(payload);
    assert.ok(['critical', 'high'].includes(result.overallRisk));
    const ddiAlert = result.alerts.find(a => a.category === 'drug_interaction');
    assert.ok(ddiAlert);
    assert.match(ddiAlert.potentialConcern, /bleeding|hemorrhage/i);
  });
});
