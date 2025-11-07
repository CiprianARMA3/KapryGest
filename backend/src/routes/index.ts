// routes/index.ts
import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import adminRoutes from './admin';
import subordinateRoutes from './subordinates';
import paymentRoutes from './payments';
import subscriptionRoutes from './subscriptions';
import fileRoutes from './files';
import universalCrudRoutes from './universalCrud'; // Add this

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/subordinate-workers', subordinateRoutes);
router.use('/payments', paymentRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/files', fileRoutes);

// Universal CRUD routes for all tables
router.use('/crud', universalCrudRoutes);

export default router;