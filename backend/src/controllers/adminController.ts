import { Request, Response } from 'express';
import { getORM } from '../config/database';
import { SUSPEND_DELETE_PASSWORD } from '../config/auth';
import { FileService } from '../services/fileService';
import { UserService } from '../services/userService';

export class AdminController {
  static async suspendUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const { password } = req.body;

      console.log(`🔄 Attempting to suspend user ${userId}`);

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      if (!SUSPEND_DELETE_PASSWORD) {
        console.error('❌ Server misconfiguration: SUSPENDDELETEUSER env variable not set');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      if (password !== SUSPEND_DELETE_PASSWORD) {
        console.log('❌ Invalid suspension password provided');
        return res.status(401).json({ error: 'Invalid suspension password' });
      }

      const orm = getORM();
      const em = orm.em.fork();
      const user = await em.findOne('UserData', { id: userId }) as any;
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.admin) {
        console.log(`❌ Attempted to suspend admin user ${userId}`);
        return res.status(403).json({ error: 'Cannot suspend admin users' });
      }

      if (user.suspended) {
        console.log(`ℹ️ User ${userId} is already suspended`);
        return res.status(400).json({ error: 'User is already suspended' });
      }

      // FIXED: Use proper parameterized query
      const conn = em.getConnection();
      await conn.execute(`UPDATE user_data SET suspended = true WHERE id = ?`, [userId]);

      console.log(`✅ User ${userId} suspended by admin`);
      res.json({ message: `User ${userId} has been suspended` });

    } catch (err) {
      console.error('❌ Suspend user error:', err);
      res.status(500).json({ error: 'Failed to suspend user' });
    }
  }

  static async unsuspendUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const { password } = req.body;

      console.log(`🔄 Attempting to unsuspend user ${userId}`);

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      if (!SUSPEND_DELETE_PASSWORD) {
        console.error('❌ Server misconfiguration: SUSPENDDELETEUSER env variable not set');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      if (password !== SUSPEND_DELETE_PASSWORD) {
        console.log('❌ Invalid unsuspension password provided');
        return res.status(401).json({ error: 'Invalid unsuspension password' });
      }

      const orm = getORM();
      const em = orm.em.fork();
      const user = await em.findOne('UserData', { id: userId }) as any;
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.suspended) {
        console.log(`ℹ️ User ${userId} is not suspended`);
        return res.status(400).json({ error: 'User is not suspended' });
      }

      // FIXED: Use proper parameterized query
      const conn = em.getConnection();
      await conn.execute(`UPDATE user_data SET suspended = false WHERE id = ?`, [userId]);

      console.log(`✅ User ${userId} unsuspended by admin`);
      res.json({ message: `User ${userId} has been unsuspended` });

    } catch (err) {
      console.error('❌ Unsuspend user error:', err);
      res.status(500).json({ error: 'Failed to unsuspend user' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const { password } = req.body;

      console.log(`🔄 Attempting to delete user ${userId}`);

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      if (!SUSPEND_DELETE_PASSWORD) {
        console.error('❌ Server misconfiguration: SUSPENDDELETEUSER env variable not set');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      if (password !== SUSPEND_DELETE_PASSWORD) {
        console.log('❌ Invalid deletion password provided');
        return res.status(401).json({ error: 'Invalid deletion password' });
      }

      const orm = getORM();
      const em = orm.em.fork();
      const user = await em.findOne('UserData', { id: userId }) as any;
      if (!user) {
        console.log(`❌ User ${userId} not found`);
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.admin) {
        console.log(`❌ Attempted to delete admin user ${userId}`);
        return res.status(403).json({ error: 'Cannot delete admin users' });
      }

      // Drop tenant tables and delete folders
      await UserService.dropUserTenantTables(userId);
      await FileService.deleteUserFolder(userId);

      // FIXED: Use proper parameterized query for deletion
      await em.nativeDelete('UserData', { id: userId });
      
      console.log(`✅ User ${userId} permanently deleted by admin`);
      res.json({ message: `User ${userId} has been permanently deleted` });
    } catch (err) {
      console.error('❌ Delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async ensureUserFolders(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      
      console.log(`🔧 Manually ensuring folder structure for user ${userId}`);
      await FileService.ensureUserFolderStructure(userId);
      
      res.json({ message: `Folder structure ensured for user ${userId}` });
    } catch (err) {
      console.error('Error ensuring folders:', err);
      res.status(500).json({ error: 'Failed to ensure folder structure' });
    }
  }
}