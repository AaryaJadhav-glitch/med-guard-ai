import { z } from 'zod';

export const PatientCreateSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional().nullable(),
  sex: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
  heightCm: z.number().positive('Height must be positive').max(300).optional().nullable(),
  weightKg: z.number().positive('Weight must be positive').max(500).optional().nullable(),
  medicalNotes: z.string().max(3000).optional().nullable()
});

export const PatientUpdateSchema = PatientCreateSchema.partial();
