// routes/paymentlogs.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { CrudService } from '../services/crudService';

const router = Router();

// GET all payment logs
router.get('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const paymentLogs = await CrudService.executeQuery(
      userId,
      `SELECT * FROM paymentlogs_${userId} ORDER BY id DESC`
    );
    res.json(paymentLogs);
  } catch (error) {
    console.error('Get payment logs error:', error);
    res.status(500).json({ error: 'Failed to fetch payment logs' });
  }
});

// GET single payment log
router.get('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const paymentLogId = Number(req.params.id);
    
    const paymentLogs = await CrudService.executeQuery(
      userId,
      `SELECT * FROM paymentlogs_${userId} WHERE id = ?`,
      [paymentLogId]
    );
    
    if (paymentLogs.length === 0) {
      return res.status(404).json({ error: 'Payment log not found' });
    }
    
    res.json(paymentLogs[0]);
  } catch (error) {
    console.error('Get payment log error:', error);
    res.status(500).json({ error: 'Failed to fetch payment log' });
  }
});

// CREATE payment log
router.post('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { invoice_id, amount, payment_method, transaction_id, status } = req.body;
    
    if (!invoice_id || !amount) {
      return res.status(400).json({ error: 'Invoice ID and amount are required' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `INSERT INTO paymentlogs_${userId} (invoice_id, amount, payment_method, transaction_id, status) 
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
      [invoice_id, amount, payment_method || '', transaction_id || '', status || 'completed']
    );
    
    res.status(201).json({
      message: 'Payment log created successfully',
      paymentLog: result[0]
    });
  } catch (error) {
    console.error('Create payment log error:', error);
    res.status(500).json({ error: 'Failed to create payment log' });
  }
});

// UPDATE payment log
router.put('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const paymentLogId = Number(req.params.id);
    const { invoice_id, amount, payment_method, transaction_id, status } = req.body;
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM paymentlogs_${userId} WHERE id = ?`,
      [paymentLogId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment log not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE paymentlogs_${userId} 
       SET invoice_id = ?, amount = ?, payment_method = ?, transaction_id = ?, status = ?
       WHERE id = ? RETURNING *`,
      [invoice_id, amount, payment_method, transaction_id, status, paymentLogId]
    );
    
    res.json({
      message: 'Payment log updated successfully',
      paymentLog: result[0]
    });
  } catch (error) {
    console.error('Update payment log error:', error);
    res.status(500).json({ error: 'Failed to update payment log' });
  }
});

// DELETE payment log
router.delete('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const paymentLogId = Number(req.params.id);
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM paymentlogs_${userId} WHERE id = ?`,
      [paymentLogId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Payment log not found' });
    }
    
    await CrudService.executeQuery(
      userId,
      `DELETE FROM paymentlogs_${userId} WHERE id = ?`,
      [paymentLogId]
    );
    
    res.json({ message: 'Payment log deleted successfully' });
  } catch (error) {
    console.error('Delete payment log error:', error);
    res.status(500).json({ error: 'Failed to delete payment log' });
  }
});

export default router;