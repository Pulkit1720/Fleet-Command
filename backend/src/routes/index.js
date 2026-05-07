import { Router } from 'express';
import jobsRoutes from './job.js';
import techniciansRoutes from './technicians.js';

const router = Router();

router.use('/jobs', jobsRoutes);
router.use('/technicians', techniciansRoutes);

export default router;