// routes/orders.ts - UPDATED VERSION
import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { CrudService } from '../services/crudService';

const router = Router();

// GET all orders
router.get('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const orders = await CrudService.executeQuery(
      userId,
      `SELECT * FROM orders_${userId} ORDER BY created_at DESC`
    );
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order
router.get('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);
    
    const orders = await CrudService.executeQuery(
      userId,
      `SELECT * FROM orders_${userId} WHERE id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(orders[0]);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// CREATE order
router.post('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity, TVA, total, status, data_invoices } = req.body;
    
    if (!product_id || !quantity || !total) {
      return res.status(400).json({ error: 'Product ID, quantity, and total are required' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `INSERT INTO orders_${userId} (product_id, quantity, TVA, total, status, data_invoices) 
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [product_id, quantity, TVA || 0, total, status || 'pending', data_invoices || {}]
    );
    
    res.status(201).json({
      message: 'Order created successfully',
      order: result[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// UPDATE order (full update)
router.put('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);
    const { product_id, quantity, TVA, total, status, data_invoices } = req.body;
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM orders_${userId} WHERE id = ?`,
      [orderId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE orders_${userId} 
       SET product_id = ?, quantity = ?, TVA = ?, total = ?, status = ?, data_invoices = ?
       WHERE id = ? RETURNING *`,
      [product_id, quantity, TVA, total, status, data_invoices, orderId]
    );
    
    res.json({
      message: 'Order updated successfully',
      order: result[0]
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// UPDATE order status only
router.patch('/:id/status', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM orders_${userId} WHERE id = ?`,
      [orderId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE orders_${userId} SET status = ? WHERE id = ? RETURNING *`,
      [status, orderId]
    );
    
    res.json({
      message: 'Order status updated successfully',
      order: result[0]
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE order
router.delete('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM orders_${userId} WHERE id = ?`,
      [orderId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    await CrudService.executeQuery(
      userId,
      `DELETE FROM orders_${userId} WHERE id = ?`,
      [orderId]
    );
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;