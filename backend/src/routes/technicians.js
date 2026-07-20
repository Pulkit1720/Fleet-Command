import { Router } from 'express';
import {
    getTechnicians,
    getTechnician,
    inviteTechnician,
    updateTechnician,
    deleteTechnician,
    updateLocation,
    getTechnicianJobs
} from '../controllers/techniciansController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Admin-facing: scoped to the requesting admin's own technicians
router.get('/', authenticate, getTechnicians);
router.post('/invite', authenticate, inviteTechnician);
router.patch('/:id', authenticate, updateTechnician);
router.delete('/:id', authenticate, deleteTechnician);

// Mobile/shared (unauthenticated for now — see plan notes)
router.get('/:id', getTechnician);
router.post('/:id/location', updateLocation);
router.get('/:id/jobs', getTechnicianJobs);

export default router;