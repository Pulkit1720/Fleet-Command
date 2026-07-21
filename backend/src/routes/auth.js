import { Router } from 'express';
import { signup, getInvite, registerTechnician } from '../controllers/authController.js';

const router = Router();

// Public — self-serve admin registration
router.post('/signup', signup);

// Public — technician invite acceptance (token-authorized, no session)
router.get('/invite/:token', getInvite);
router.post('/register', registerTechnician);

export default router;
