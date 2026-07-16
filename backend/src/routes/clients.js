import { Router } from 'express';
import {
    getClients,
    createClient,
    updateClient,
    deleteClient,
} from '../controllers/clientsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Admin-facing: scoped to the requesting admin's own clients
router.get('/', authenticate, getClients);
router.post('/', authenticate, createClient);
router.patch('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

export default router;
