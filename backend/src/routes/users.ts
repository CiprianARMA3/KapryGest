import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, isAdmin, UserController.getAllUsers);

export default router;