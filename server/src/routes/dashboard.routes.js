import { Router } from 'express';
import { getDashboardStats } from '../controllers/profile.controller.js';

const router = Router();

router.get('/stats', getDashboardStats);

export default router;
