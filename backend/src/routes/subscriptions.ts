import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken, SubscriptionController.createSubscription);
router.get('/', authenticateToken, SubscriptionController.getSubscriptions);

export default router;