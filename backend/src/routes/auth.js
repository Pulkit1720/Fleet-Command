import { Router } from 'express';
import { signup } from '../controllers/authController.js';

const router = Router();

// Public — self-serve admin registration
router.post('/signup', signup);

export default router;
