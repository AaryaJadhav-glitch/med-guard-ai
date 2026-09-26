import { Router } from 'express';
import { runAnalysis, getAnalyses, getAnalysisById } from '../controllers/analysis.controller.js';
import { analysisLimiter } from '../middleware/security.middleware.js';

const router = Router();

router.post('/', analysisLimiter, runAnalysis);
router.get('/', getAnalyses);
router.get('/:id', getAnalysisById);

export default router;
