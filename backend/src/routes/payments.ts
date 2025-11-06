import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, PaymentController.createPayment);
router.get('/', authenticateToken, PaymentController.getPayments);

export default router;