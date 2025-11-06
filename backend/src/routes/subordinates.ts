import { Router } from 'express';
import { SubordinateController } from '../controllers/subordinateController';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { validateSubordinateWorker } from '../validators/subordinateValidators';

const router = Router();

router.get('/', authenticateToken, checkSuspended, SubordinateController.getSubordinateWorkers);
router.get('/:id', authenticateToken, checkSuspended, SubordinateController.getSubordinateWorker);
router.post('/', authenticateToken, checkSuspended, validateSubordinateWorker, SubordinateController.createSubordinateWorker);
router.put('/:id', authenticateToken, checkSuspended, SubordinateController.updateSubordinateWorker);
router.delete('/:id', authenticateToken, checkSuspended, SubordinateController.deleteSubordinateWorker);

export default router;