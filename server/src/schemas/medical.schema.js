import { z } from 'zod';

export const AllergyCreateSchema = z.object({
  allergen: z.string().trim().min(1, 'Allergen name is required').max(150),
  reaction: z.string().max(300).optional().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening', 'unknown']).default('unknown'),
  notes: z.string().max(1000).optional().nullable()
});

export const AllergyUpdateSchema = AllergyCreateSchema.partial();

export const ConditionCreateSchema = z.object({
  conditionName: z.string().trim().min(1, 'Condition name is required').max(200),
  status: z.enum(['active', 'managed', 'in_remission', 'resolved', 'historical']).default('active'),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical', 'unspecified']).default('moderate'),
  diagnosisDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Diagnosis date must be YYYY-MM-DD').optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const ConditionUpdateSchema = ConditionCreateSchema.partial();

export const MedicationCreateSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(200),
  genericName: z.string().max(200).optional().nullable(),
  brandName: z.string().max(200).optional().nullable(),
  strength: z.string().max(100).optional().nullable(),
  dosageForm: z.string().max(100).optional().nullable(),
  dose: z.string().max(100).optional().nullable(),
  frequency: z.string().max(100).optional().nullable(),
  route: z.string().max(100).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD').optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD').optional().nullable(),
  active: z.boolean().default(true),
  prescribingProvider: z.string().max(150).optional().nullable(),
  notes: z.string().max(1000).optional().nullable()
});

export const MedicationUpdateSchema = MedicationCreateSchema.partial();
