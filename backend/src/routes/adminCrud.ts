// routes/adminCrud.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { UniversalCrudService } from '../services/universalCrudService';

const router = Router();

// Supported tables for CRUD operations
const SUPPORTED_TABLES = [
  'customers', 'products', 'orders', 'stocks', 
  'invoices', 'paymentlogs', 'subordinateworkers'
];

// Helper function for safe error handling
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

// ADMIN: CREATE record in user's table
router.post('/:userId/:table', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.userId); // The user whose data we're accessing
    const table = req.params.table;
    const data = req.body;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    console.log('🔄 Admin creating record:', {
      targetUserId,
      table,
      data
    });

    const result = await UniversalCrudService.createRecord(targetUserId, table, data);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: result.message,
      [table]: result.data
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Admin create ${req.params.table} for user ${req.params.userId} error:`, errorMessage);
    res.status(500).json({ error: `Failed to create ${req.params.table}` });
  }
});

// ADMIN: UPDATE record in user's table
router.put('/:userId/:table/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.userId); // The user whose data we're accessing
    const table = req.params.table;
    const id = Number(req.params.id);
    const data = req.body;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    console.log('🔄 Admin updating record:', {
      targetUserId,
      table,
      id,
      data
    });

    const result = await UniversalCrudService.updateRecord(targetUserId, table, id, data);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: result.message,
      [table]: result.data
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Admin update ${req.params.table} for user ${req.params.userId} error:`, errorMessage);
    res.status(500).json({ error: `Failed to update ${req.params.table}` });
  }
});

// ADMIN: DELETE record from user's table
router.delete('/:userId/:table/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const targetUserId = Number(req.params.userId); // The user whose data we're accessing
    const table = req.params.table;
    const id = Number(req.params.id);
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    console.log('🔄 Admin deleting record:', {
      targetUserId,
      table,
      id
    });

    const result = await UniversalCrudService.deleteRecord(targetUserId, table, id);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: result.message });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Admin delete ${req.params.table} for user ${req.params.userId} error:`, errorMessage);
    res.status(500).json({ error: `Failed to delete ${req.params.table}` });
  }
});



export default router;