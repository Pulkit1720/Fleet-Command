import { Router } from 'express';
import jobsRoutes from './jobs.js';
import techniciansRoutes from './technicians.js';

const router = Router();

router.use('/jobs', jobsRoutes);
router.use('/technicians', techniciansRoutes);

export default router;