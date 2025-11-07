// routes/universalCrud.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
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

// GET all records from a table
router.get('/:table', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await UniversalCrudService.getAllRecords(userId, table, limit, offset);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Get ${req.params.table} error:`, errorMessage);
    res.status(500).json({ error: `Failed to fetch ${req.params.table}` });
  }
});

// GET single record by ID
router.get('/:table/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    const id = Number(req.params.id);
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const result = await UniversalCrudService.getRecordById(userId, table, id);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Get ${req.params.table} error:`, errorMessage);
    res.status(500).json({ error: `Failed to fetch ${req.params.table}` });
  }
});

// CREATE new record
router.post('/:table', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    const data = req.body;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const result = await UniversalCrudService.createRecord(userId, table, data);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: result.message,
      [table]: result.data
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Create ${req.params.table} error:`, errorMessage);
    res.status(500).json({ error: `Failed to create ${req.params.table}` });
  }
});

// UPDATE record
router.put('/:table/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    const id = Number(req.params.id);
    const data = req.body;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const result = await UniversalCrudService.updateRecord(userId, table, id, data);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: result.message,
      [table]: result.data
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Update ${req.params.table} error:`, errorMessage);
    res.status(500).json({ error: `Failed to update ${req.params.table}` });
  }
});

// DELETE record
router.delete('/:table/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    const id = Number(req.params.id);
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const result = await UniversalCrudService.deleteRecord(userId, table, id);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: result.message });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Delete ${req.params.table} error:`, errorMessage);
    res.status(500).json({ error: `Failed to delete ${req.params.table}` });
  }
});

// GET table structure (for dynamic form generation)
router.get('/:table/structure/columns', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const columns = await UniversalCrudService.getTableColumns(userId, table);
    res.json(columns);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Get ${req.params.table} structure error:`, errorMessage);
    res.status(500).json({ error: `Failed to fetch ${req.params.table} structure` });
  }
});

// GET table structure with field types
router.get('/:table/structure/fields', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const table = req.params.table;
    
    if (!SUPPORTED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table ${table} is not supported` });
    }

    const fieldTypes = await UniversalCrudService.getFieldTypes(userId, table);
    res.json(fieldTypes);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`Get ${req.params.table} field types error:`, errorMessage);
    res.status(500).json({ error: `Failed to fetch ${req.params.table} field types` });
  }
});

export default router;