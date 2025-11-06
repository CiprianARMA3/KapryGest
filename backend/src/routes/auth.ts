import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../validators/authValidators';

const router = Router();

router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.get('/me', authenticateToken, checkSuspended, AuthController.getCurrentUser);

export default router;