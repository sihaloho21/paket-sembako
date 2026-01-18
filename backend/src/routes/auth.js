import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/verify', authenticateToken, authController.verify);
router.post('/logout', authenticateToken, authController.logout);

export default router;
