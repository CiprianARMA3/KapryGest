import { Router } from 'express';
import { FileController } from '../controllers/fileController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.get('/admin/store/:id', authenticateToken, isAdmin, FileController.getUserStore);
router.get('/admin/store/:id/preview', authenticateToken, isAdmin, FileController.previewFile);
router.get('/admin/store/:id/download', authenticateToken, isAdmin, FileController.downloadFile);
router.get('/admin/export/:id', authenticateToken, isAdmin, FileController.exportUserData);

export default router;