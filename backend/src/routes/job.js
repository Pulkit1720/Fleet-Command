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

const router = Router();

// Jobs CRUD
router.get('/', getJobs);
router.get('/stats', getJobStats);
router.get('/address-search', searchAddress);
router.get('/:id', getJob);
router.post('/', createJob);
router.put('/:id', updateJob);
router.patch('/:id', updateJob);
router.post('/:id/status', updateJobStatus);
router.get('/:id/logs', getJobLogs);
router.get('/:id/geofence', checkGeofence);

export default router;