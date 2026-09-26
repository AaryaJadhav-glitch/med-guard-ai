import { z } from 'zod';

export const RiskSeverityEnum = z.enum(['critical', 'high', 'moderate', 'low', 'informational']);

export const RiskCategoryEnum = z.enum([
  'drug_interaction',
  'allergy',
  'contraindication',
  'duplicate_therapy',
  'dose_concern',
  'monitoring',
  'patient_specific'
]);

export const NewMedicationInputSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(200),
  strength: z.string().max(100).optional().nullable(),
  dose: z.string().max(100).optional().nullable(),
  frequency: z.string().max(100).optional().nullable(),
  route: z.string().max(100).optional().nullable(),
  duration: z.string().max(100).optional().nullable(),
  indication: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const AnalysisChecksSchema = z.object({
  drugInteractions: z.boolean().default(true),
  allergies: z.boolean().default(true),
  contraindications: z.boolean().default(true),
  duplicateTherapy: z.boolean().default(true),
  doseConcerns: z.boolean().default(true),
  monitoring: z.boolean().default(true)
}).default({
  drugInteractions: true,
  allergies: true,
  contraindications: true,
  duplicateTherapy: true,
  doseConcerns: true,
  monitoring: true
});

export const AnalysisRequestSchema = z.object({
  patientId: z.string().uuid('Valid patient UUID is required'),
  newMedications: z.array(NewMedicationInputSchema).min(1, 'At least one new medication is required for analysis'),
  checks: AnalysisChecksSchema,
  disclaimerAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge the clinical decision support disclaimer.' })
  })
});

export const AlternativeSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(1),
  caveats: z.string().default('Requires full clinical review and reconciliation before prescribing.')
});

export const AlertSchema = z.object({
  severity: RiskSeverityEnum,
  category: RiskCategoryEnum,
  title: z.string().min(1),
  medicationsInvolved: z.array(z.string()).default([]),
  explanation: z.string().min(1),
  potentialConcern: z.string().min(1),
  recommendedClinicalAction: z.string().min(1),
  monitoring: z.array(z.string()).default([]),
  possibleAlternatives: z.array(AlternativeSchema).default([]),
  confidence: z.number().min(0).max(1).default(0.85),
  limitations: z.array(z.string()).default([])
});

export const AnalysisResponseSchema = z.object({
  overallRisk: RiskSeverityEnum,
  summary: z.string().min(1),
  alerts: z.array(AlertSchema),
  requiresProfessionalReview: z.boolean().default(true),
  dataLimitations: z.array(z.string()).default([])
});
