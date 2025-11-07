import { Router, Request, Response } from 'express';
import { authenticateToken, checkSuspended } from '../middleware/auth';
import { CrudService } from '../services/crudService';

const router = Router();

// GET all customers for user
router.get('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const customers = await CrudService.executeQuery(
      userId,
      `SELECT * FROM customers_${userId} ORDER BY id DESC`
    );
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET single customer by ID
router.get('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const customerId = Number(req.params.id);
    
    const customers = await CrudService.executeQuery(
      userId,
      `SELECT * FROM customers_${userId} WHERE id = ?`,
      [customerId]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customers[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// CREATE new customer
router.post('/', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, surname, email, phone_number, billing_address } = req.body;
    
    if (!name || !surname || !email) {
      return res.status(400).json({ error: 'Name, surname, and email are required' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `INSERT INTO customers_${userId} (name, surname, email, phone_number, billing_address) 
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
      [name, surname, email, phone_number || '', billing_address || '']
    );
    
    res.status(201).json({
      message: 'Customer created successfully',
      customer: result[0]
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// UPDATE customer
router.put('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const customerId = Number(req.params.id);
    const { name, surname, email, phone_number, billing_address } = req.body;
    
    // Check if customer exists
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM customers_${userId} WHERE id = ?`,
      [customerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const result = await CrudService.executeQuery(
      userId,
      `UPDATE customers_${userId} 
       SET name = ?, surname = ?, email = ?, phone_number = ?, billing_address = ?
       WHERE id = ? RETURNING *`,
      [name, surname, email, phone_number, billing_address, customerId]
    );
    
    res.json({
      message: 'Customer updated successfully',
      customer: result[0]
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE customer
router.delete('/:id', authenticateToken, checkSuspended, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const customerId = Number(req.params.id);
    
    // Check if customer exists
    const existing = await CrudService.executeQuery(
      userId,
      `SELECT id FROM customers_${userId} WHERE id = ?`,
      [customerId]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    await CrudService.executeQuery(
      userId,
      `DELETE FROM customers_${userId} WHERE id = ?`,
      [customerId]
    );
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;