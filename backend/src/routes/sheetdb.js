import express from 'express';
import { sheetdbController } from '../controllers/sheetdbController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', sheetdbController.getData);
router.get('/search', sheetdbController.searchData);

// Protected routes (require authentication)
router.post('/', authenticateToken, requireAdmin, sheetdbController.postData);
router.patch('/:identifier', authenticateToken, requireAdmin, sheetdbController.patchData);
router.delete('/:identifier', authenticateToken, requireAdmin, sheetdbController.deleteData);

// Cache management (admin only)
router.post('/cache/clear', authenticateToken, requireAdmin, sheetdbController.clearCache);
router.get('/cache/stats', authenticateToken, requireAdmin, sheetdbController.getCacheStats);

export default router;
