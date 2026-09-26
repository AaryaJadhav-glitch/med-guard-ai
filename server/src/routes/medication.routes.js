import { Router } from 'express';
import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication
} from '../controllers/medication.controller.js';

const router = Router({ mergeParams: true });

router.get('/', getMedications);
router.post('/', createMedication);
router.patch('/:id', updateMedication);
router.delete('/:id', deleteMedication);

export default router;
