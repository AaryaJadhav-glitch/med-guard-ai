import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import patientRoutes from './patient.routes.js';
import allergyRoutes from './allergy.routes.js';
import conditionRoutes from './condition.routes.js';
import medicationRoutes from './medication.routes.js';
import analysisRoutes from './analysis.routes.js';
import profileRoutes from './profile.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

// Public health check route
router.get('/health', (req, res) => {
  return res.json({
    status: 'healthy',
    system: 'Med-Guard AI Clinical Safety Engine',
    timestamp: new Date().toISOString()
  });
});

// Protected clinical endpoints require verified authentication
router.use('/patients', requireAuth, patientRoutes);
router.use('/patients/:patientId/allergies', requireAuth, allergyRoutes);
router.use('/allergies', requireAuth, allergyRoutes);
router.use('/patients/:patientId/conditions', requireAuth, conditionRoutes);
router.use('/conditions', requireAuth, conditionRoutes);
router.use('/patients/:patientId/medications', requireAuth, medicationRoutes);
router.use('/medications', requireAuth, medicationRoutes);
router.use('/analysis', requireAuth, analysisRoutes);
router.use('/profile', requireAuth, profileRoutes);
router.use('/dashboard', requireAuth, dashboardRoutes);

// 404 Handler for unrecognized /api endpoints
router.use((req, res) => {
  res.status(404).json({ error: `Clinical endpoint ${req.method} ${req.originalUrl} not found.` });
});

export default router;
