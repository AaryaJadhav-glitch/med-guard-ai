import { Router } from 'express';
import {
  getAllergies,
  createAllergy,
  updateAllergy,
  deleteAllergy
} from '../controllers/allergy.controller.js';

const router = Router({ mergeParams: true });

// Mounted under /api/patients/:patientId/allergies OR /api/allergies
router.get('/', getAllergies);
router.post('/', createAllergy);
router.patch('/:id', updateAllergy);
router.delete('/:id', deleteAllergy);

export default router;
