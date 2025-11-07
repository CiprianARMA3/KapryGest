import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { CrudService } from '../services/crudService';

const router = Router();

// GET all products
router.get('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const products = await CrudService.executeQuery(
      userId,
      `SELECT * FROM products_${userId} ORDER BY id DESC`
    );
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
router.get('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);
    
    const products = await CrudService.executeQuery(
      userId,
      `SELECT * FROM products_${userId} WHERE id = ?`,
      [productId]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// CREATE product
router.post('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, category, price, reduced_percentage, description, data } = req.body;
    
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `INSERT INTO products_${userId} (name, category, price, reduced_percentage, description, data) 
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [name, category, price, reduced_percentage || 0, description || '', data || {}]
    );
    
    res.status(201).json({
      message: 'Product created successfully',
      product: result[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE product
router.put('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);
    const { name, category, price, reduced_percentage, description, data } = req.body;
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM products_${userId} WHERE id = ?`,
      [productId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE products_${userId} 
       SET name = ?, category = ?, price = ?, reduced_percentage = ?, description = ?, data = ?
       WHERE id = ? RETURNING *`,
      [name, category, price, reduced_percentage, description, data, productId]
    );
    
    res.json({
      message: 'Product updated successfully',
      product: result[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.id);
    
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM products_${userId} WHERE id = ?`,
      [productId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await CrudService.executeQuery(
      userId,
      `DELETE FROM products_${userId} WHERE id = ?`,
      [productId]
    );
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;