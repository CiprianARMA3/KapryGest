// routes/invoices.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { CrudService } from '../services/crudService';

const router = Router();

// GET all invoices
router.get('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const invoices = await CrudService.executeQuery(
      userId,
      `SELECT * FROM invoices_${userId} ORDER BY id DESC`
    );
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET single invoice
router.get('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const invoiceId = Number(req.params.id);
    
    const invoices = await CrudService.executeQuery(
      userId,
      `SELECT * FROM invoices_${userId} WHERE id = ?`,
      [invoiceId]
    );
    
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoices[0]);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// CREATE invoice
router.post('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { order_id, customer_id, total_amount, issue_date, due_date, status } = req.body;
    
    if (!order_id || !total_amount) {
      return res.status(400).json({ error: 'Order ID and total amount are required' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `INSERT INTO invoices_${userId} (order_id, customer_id, total_amount, issue_date, due_date, status) 
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [order_id, customer_id, total_amount, issue_date || new Date(), due_date, status || 'pending']
    );
    
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: result[0]
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// UPDATE invoice
router.put('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const invoiceId = Number(req.params.id);
    const { order_id, customer_id, total_amount, issue_date, due_date, status } = req.body;
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM invoices_${userId} WHERE id = ?`,
      [invoiceId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE invoices_${userId} 
       SET order_id = ?, customer_id = ?, total_amount = ?, issue_date = ?, due_date = ?, status = ?
       WHERE id = ? RETURNING *`,
      [order_id, customer_id, total_amount, issue_date, due_date, status, invoiceId]
    );
    
    res.json({
      message: 'Invoice updated successfully',
      invoice: result[0]
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// DELETE invoice
router.delete('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const invoiceId = Number(req.params.id);
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM invoices_${userId} WHERE id = ?`,
      [invoiceId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    await CrudService.executeQuery(
      userId,
      `DELETE FROM invoices_${userId} WHERE id = ?`,
      [invoiceId]
    );
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;