import { Router, Request, Response } from 'express';
import { EntityData, MikroORM } from '@mikro-orm/postgresql';
import { AdminController } from '../controllers/adminController';
import { authenticateToken, isAdmin } from '../middleware/auth';
import usersConfig from '../config/users-orm.config';

const router = Router();

// User management routes
router.post('/users/:id/suspend', authenticateToken, isAdmin, AdminController.suspendUser);
router.post('/users/:id/unsuspend', authenticateToken, isAdmin, AdminController.unsuspendUser);
router.delete('/users/:id', authenticateToken, isAdmin, AdminController.deleteUser);
router.post('/users/:id/ensure-folders', authenticateToken, isAdmin, AdminController.ensureUserFolders);

// Subordinate workers routes
router.get('/users/:id/subordinate-workers', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    
    const tableName = `subordinateworkers_${userId}`;
    
    // Check if table exists first - FIXED: Use ? instead of $1
    const tableExists = await conn.execute(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ?)`,
      [tableName]
    );
    
    let workers: EntityData<Partial<any>>[] = [];
    if (tableExists[0].exists) {
      workers = await conn.execute(
        `SELECT id, name, surname, email, phone_number, role, permissions, logs, created_at, is_active
        FROM ${tableName} 
        WHERE user_id = ?`,
        [userId]
      );
    }
    
    await usersOrm.close();
    res.json(workers);
  } catch (err) {
    console.error('Admin get subordinate workers error:', err);
    res.status(500).json({ error: "Failed to fetch subordinate workers" });
  }
});

// Tenant table routes
router.get('/tenant/:id/:table', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const table = req.params.table;

    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();

    // Table format: {table}_{userId}
    const tableName = `${table}_${userId}`;

    // Check if table exists first - FIXED: Use ? instead of $1
    const tableExists = await conn.execute(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ?)`,
      [tableName]
    );

    if (!tableExists[0].exists) {
      await usersOrm.close();
      return res.json([]); // Return empty array if table doesn't exist
    }

    const rows = await conn.execute(`SELECT * FROM ${tableName} LIMIT 100;`);
    await usersOrm.close();
    res.json(rows);
  } catch (err) {
    console.error('Tenant table fetch error:', err);
    res.status(500).json({ error: "Failed to fetch tenant table" });
  }
});

router.get('/tenant/:id/:table/columns', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const table = req.params.table;
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    const tableName = `${table}_${userId}`;

    // Check if table exists first - FIXED: Use ? instead of $1
    const tableExists = await conn.execute(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ?)`,
      [tableName]
    );

    if (!tableExists[0].exists) {
      await usersOrm.close();
      return res.json([]); // Return empty array if table doesn't exist
    }

    // FIXED: Use ? instead of $1
    const result = await conn.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = ?
      ORDER BY ordinal_position;
    `, [tableName]);

    const columns = result.map((row: any) => row.column_name);
    await usersOrm.close();
    res.json(columns);
  } catch (err) {
    console.error('Tenant table columns error:', err);
    res.status(500).json({ error: "Failed to fetch tenant table columns" });
  }
});

// Debug tables endpoint - FIXED PARAMETER SYNTAX
router.get('/debug-tables/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    
    const tables = ['customers', 'orders', 'products', 'stocks', 'invoices', 'paymentlogs', 'subordinateworkers'];
    const result: any = {};
    
    for (const table of tables) {
      const tableName = `${table}_${userId}`;
      
      // Check if table exists - FIXED: Use ? instead of $1
      const tableExists = await conn.execute(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ?)`,
        [tableName]
      );
      
      result[table] = {
        tableName,
        exists: tableExists[0].exists,
        rowCount: 0,
        columns: []
      };
      
      if (tableExists[0].exists) {
        // Get row count
        const countResult = await conn.execute(`SELECT COUNT(*) FROM ${tableName}`);
        result[table].rowCount = parseInt(countResult[0].count);
        
        // Get columns - FIXED: Use ? instead of $1
        const columns = await conn.execute(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ?
          ORDER BY ordinal_position
        `, [tableName]);
        
        result[table].columns = columns.map((row: any) => row.column_name);
        
        // Get sample data (first 2 rows)
        if (result[table].rowCount > 0) {
          const sampleData = await conn.execute(`SELECT * FROM ${tableName} LIMIT 2`);
          result[table].sampleData = sampleData;
        }
      }
    }
    
    await usersOrm.close();
    res.json(result);
  } catch (err) {
    console.error('Debug tables error:', err);
    res.status(500).json({ error: "Debug failed" });
  }
});

export default router;