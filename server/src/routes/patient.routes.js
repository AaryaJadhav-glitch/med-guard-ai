import { Router } from 'express';
import {
  getPatients,
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  seedDemoPatients
} from '../controllers/patient.controller.js';

const router = Router();

router.get('/', getPatients);
router.post('/', createPatient);
router.post('/seed', seedDemoPatients);
router.get('/:id', getPatientById);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
