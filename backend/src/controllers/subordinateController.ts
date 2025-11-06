import { Request, Response } from 'express';
import { ArchiveService } from '../services/archiveService';
import { DatabaseService } from '../services/databaseService';
import { AuthService } from '../services/authService';

interface SubordinateWorker {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone_number: number;
  role: string;
  password: string;
  permissions?: any;
  logs?: any;
  user_id: number;
  is_active: boolean;
  created_at: Date;
}

export class SubordinateController {
  static async getSubordinateWorkers(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'User not found' });

      const tableName = `subordinateworkers_${userId}`;
      
      const tableExists = await DatabaseService.tableExists(userId, tableName);
      if (!tableExists) return res.json([]);
      
      const workers = await DatabaseService.executeUserQuery(
        userId,
        `SELECT id, name, surname, email, phone_number, role, permissions, logs, created_at, is_active
        FROM ${tableName} 
        WHERE user_id = $1 AND is_active = true`,
        [userId]
      ) as SubordinateWorker[];
      
      res.json(workers);
    } catch (err) {
      console.error('Get subordinate workers error:', err);
      res.status(500).json({ error: 'Failed to fetch subordinate workers' });
    }
  }

  static async getSubordinateWorker(req: Request, res: Response) {
    try {
      const workerId = Number(req.params.id);
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'User not found' });

      const tableName = `subordinateworkers_${userId}`;
      
      const tableExists = await DatabaseService.tableExists(userId, tableName);
      if (!tableExists) return res.status(404).json({ error: 'Subordinate worker not found' });
      
      const workers = await DatabaseService.executeUserQuery(
        userId,
        `SELECT * FROM ${tableName} 
        WHERE id = $1 AND user_id = $2 AND is_active = true`,
        [workerId, userId]
      ) as SubordinateWorker[];
      
      if (workers.length === 0) {
        return res.status(404).json({ error: 'Subordinate worker not found' });
      }
      
      res.json(workers[0]);
    } catch (err) {
      console.error('Get subordinate worker error:', err);
      res.status(500).json({ error: 'Failed to fetch subordinate worker' });
    }
  }

  static async createSubordinateWorker(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'User not found' });

      const { name, surname, email, phone_number, role, password, permissions } = req.body;
      
      const tableName = `subordinateworkers_${userId}`;
      
      // Create table if it doesn't exist
      await DatabaseService.createSubordinateWorkersTable(userId);
      
      // Check if email already exists
      const existingWorker = await DatabaseService.executeUserQuery(
        userId,
        `SELECT id FROM ${tableName} WHERE email = $1 AND user_id = $2`,
        [email, userId]
      );
      
      if (existingWorker.length > 0) {
        return res.status(400).json({ error: 'Email already exists for subordinate worker' });
      }

      const hashedPassword = await AuthService.hashPassword(password);

      // Insert new worker
      const result = await DatabaseService.executeUserQuery(
        userId,
        `INSERT INTO ${tableName} 
        (name, surname, email, phone_number, role, password, permissions, logs, user_id, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          name, surname, email, phone_number, role, hashedPassword, 
          permissions || {}, 
          JSON.stringify([]), 
          userId, 
          true, 
          new Date()
        ]
      ) as SubordinateWorker[];

      // Update archive
      await ArchiveService.updateSubordinateWorkersArchive(userId);
      
      res.status(201).json({
        message: 'Subordinate worker created successfully',
        worker: result[0]
      });
    } catch (err) {
      console.error('Create subordinate worker error:', err);
      res.status(500).json({ error: 'Failed to create subordinate worker' });
    }
  }

  static async updateSubordinateWorker(req: Request, res: Response) {
    try {
      const workerId = Number(req.params.id);
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'User not found' });

      const tableName = `subordinateworkers_${userId}`;
      
      // Check if worker exists
      const existingWorker = await DatabaseService.executeUserQuery(
        userId,
        `SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`,
        [workerId, userId]
      ) as SubordinateWorker[];
      
      if (existingWorker.length === 0) {
        return res.status(404).json({ error: 'Subordinate worker not found' });
      }

      const { name, surname, email, phone_number, role, password, permissions } = req.body;
      
      // Build update query
      const updates: string[] = [];
      const values: any[] = [];
      
      if (name !== undefined) { updates.push('name = $' + (values.length + 1)); values.push(name); }
      if (surname !== undefined) { updates.push('surname = $' + (values.length + 1)); values.push(surname); }
      if (email !== undefined) { updates.push('email = $' + (values.length + 1)); values.push(email); }
      if (phone_number !== undefined) { updates.push('phone_number = $' + (values.length + 1)); values.push(phone_number); }
      if (role !== undefined) { updates.push('role = $' + (values.length + 1)); values.push(role); }
      if (password !== undefined) { 
        const hashedPassword = await AuthService.hashPassword(password);
        updates.push('password = $' + (values.length + 1)); 
        values.push(hashedPassword); 
      }
      if (permissions !== undefined) { updates.push('permissions = $' + (values.length + 1)); values.push(permissions); }

      // Add update log
      const currentLogs = existingWorker[0].logs || [];
      const updateLog = {
        timestamp: new Date().toISOString(),
        action: 'update',
        changes: req.body
      };
      const updatedLogs = [...currentLogs, updateLog];
      
      updates.push('logs = $' + (values.length + 1));
      values.push(JSON.stringify(updatedLogs));

      // Add WHERE clause parameters
      values.push(workerId);
      values.push(userId);

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updateQuery = `
        UPDATE ${tableName} 
        SET ${updates.join(', ')} 
        WHERE id = $${values.length - 1} AND user_id = $${values.length}
        RETURNING *
      `;

      const result = await DatabaseService.executeUserQuery(userId, updateQuery, values) as SubordinateWorker[];
      
      res.json({
        message: 'Subordinate worker updated successfully',
        worker: result[0]
      });
    } catch (err) {
      console.error('Update subordinate worker error:', err);
      res.status(500).json({ error: 'Failed to update subordinate worker' });
    }
  }

  static async deleteSubordinateWorker(req: Request, res: Response) {
    try {
      const workerId = Number(req.params.id);
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: 'User not found' });

      const tableName = `subordinateworkers_${userId}`;
      
      // Check if worker exists
      const existingWorker = await DatabaseService.executeUserQuery(
        userId,
        `SELECT * FROM ${tableName} WHERE id = $1 AND user_id = $2`,
        [workerId, userId]
      ) as SubordinateWorker[];
      
      if (existingWorker.length === 0) {
        return res.status(404).json({ error: 'Subordinate worker not found' });
      }

      // Soft delete by setting is_active to false
      await DatabaseService.executeUserQuery(
        userId,
        `UPDATE ${tableName} 
        SET is_active = false 
        WHERE id = $1 AND user_id = $2`,
        [workerId, userId]
      );
      
      res.json({ message: 'Subordinate worker deleted successfully' });
    } catch (err) {
      console.error('Delete subordinate worker error:', err);
      res.status(500).json({ error: 'Failed to delete subordinate worker' });
    }
  }
}