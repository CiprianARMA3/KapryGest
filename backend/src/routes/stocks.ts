// routes/stocks.ts
import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { CrudService } from '../services/crudService';

const router = Router();

// GET all stocks
router.get('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const stocks = await CrudService.executeQuery(
      userId,
      `SELECT * FROM stocks_${userId} ORDER BY id DESC`
    );
    res.json(stocks);
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// GET single stock
router.get('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const stockId = Number(req.params.id);
    
    const stocks = await CrudService.executeQuery(
      userId,
      `SELECT * FROM stocks_${userId} WHERE id = ?`,
      [stockId]
    );
    
    if (stocks.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    res.json(stocks[0]);
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
});

// CREATE stock
router.post('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity, location, minimum_stock } = req.body;
    
    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `INSERT INTO stocks_${userId} (product_id, quantity, location, minimum_stock) 
       VALUES (?, ?, ?, ?) RETURNING *`,
      [product_id, quantity, location || '', minimum_stock || 0]
    );
    
    res.status(201).json({
      message: 'Stock created successfully',
      stock: result[0]
    });
  } catch (error) {
    console.error('Create stock error:', error);
    res.status(500).json({ error: 'Failed to create stock' });
  }
});

// UPDATE stock
router.put('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const stockId = Number(req.params.id);
    const { product_id, quantity, location, minimum_stock } = req.body;
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM stocks_${userId} WHERE id = ?`,
      [stockId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE stocks_${userId} 
       SET product_id = ?, quantity = ?, location = ?, minimum_stock = ?
       WHERE id = ? RETURNING *`,
      [product_id, quantity, location, minimum_stock, stockId]
    );
    
    res.json({
      message: 'Stock updated successfully',
      stock: result[0]
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// DELETE stock
router.delete('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const stockId = Number(req.params.id);
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM stocks_${userId} WHERE id = ?`,
      [stockId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    
    await CrudService.executeQuery(
      userId,
      `DELETE FROM stocks_${userId} WHERE id = ?`,
      [stockId]
    );
    
    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ error: 'Failed to delete stock' });
  }
});

export default router;