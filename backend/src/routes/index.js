import { Router } from 'express';
import jobsRoutes from './job.js';
import techniciansRoutes from './technicians.js';
import authRoutes from './auth.js';
import clientsRoutes from './clients.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/technicians', techniciansRoutes);
router.use('/clients', clientsRoutes);

export default router;