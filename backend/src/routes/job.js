import { Router } from 'express';
import {
    getJobs,
    getJob,
    createJob,
    updateJob,
    updateJobStatus,
    getJobStats,
    searchAddress,
    getJobLogs,
    checkGeofence
} from '../controllers/jobsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Admin-facing: scoped to the requesting admin's own jobs
router.get('/', authenticate, getJobs);
router.get('/stats', authenticate, getJobStats);
router.post('/', authenticate, createJob);

// Shared / mobile (unauthenticated for now — see plan notes)
router.get('/address-search', searchAddress);
router.post('/:id/status', updateJobStatus);
router.get('/:id/logs', getJobLogs);
router.get('/:id/geofence', checkGeofence);

// Admin-facing single-job read/edit (declared after static paths above)
router.get('/:id', authenticate, getJob);
router.put('/:id', authenticate, updateJob);
router.patch('/:id', authenticate, updateJob);

export default router;