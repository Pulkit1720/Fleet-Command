import { Router } from 'express';
import {
    getTechnicians,
    getTechnician,
    inviteTechnician,
    updateLocation,
    getTechnicianJobs
} from '../controllers/techniciansController.js';

const router = Router();

router.get('/', getTechnicians);
router.post('/invite', inviteTechnician);
router.get('/:id', getTechnician);
router.post('/:id/location', updateLocation);
router.get('/:id/jobs', getTechnicianJobs);

export default router;