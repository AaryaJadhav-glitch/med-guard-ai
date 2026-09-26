import { Router } from 'express';
import {
  getConditions,
  createCondition,
  updateCondition,
  deleteCondition
} from '../controllers/condition.controller.js';

const router = Router({ mergeParams: true });

router.get('/', getConditions);
router.post('/', createCondition);
router.patch('/:id', updateCondition);
router.delete('/:id', deleteCondition);

export default router;
