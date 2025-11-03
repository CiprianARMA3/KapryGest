// -------------------- LOAD ENV FIRST -------------------- //
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
dotenvConfig({ path: path.resolve(__dirname, './db/security_keys/.env') });

// -------------------- IMPORT DEPENDENCIES -------------------- //
import express, { Request, Response } from 'express';
import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import config from './admin-orm.config';
import usersConfig from './users-orm.config';
import { UserData } from './entities/admin-side/UserData';
import { PaymentData } from './entities/admin-side/PaymentData';
import { SubscriptionData } from './entities/admin-side/SubscriptionData';
import cors from 'cors';
import cookieParser = require('cookie-parser');
import fs from 'fs';
import fsPromises from 'fs/promises';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUserTenantTables } from './services/userServices';
import archiver from 'archiver'; 

// -------------------- INTERFACES -------------------- //
interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

// -------------------- INIT EXPRESS -------------------- //
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());

// -------------------- ORM INSTANCE -------------------- //
let orm: MikroORM;

// -------------------- JWT CONFIG -------------------- //
const JWT_SECRET = process.env.JWT_SECRET || 'c476459dc1b0b71f2ee35fb37dc0c8b1612e2bcd7fd623e9c49f0832d50f6b41';
const TOKEN_EXPIRY = '7d'; // valid for 7 days
const SUSPEND_DELETE_PASSWORD = process.env.SUSPENDDELETEUSER; 

// Log environment variable status
console.log('🔐 Environment variable status:');
console.log('SUSPENDDELETEUSER loaded:', SUSPEND_DELETE_PASSWORD ? 'YES' : 'NO');

// -------------------- MIDDLEWARE -------------------- //
function authenticateToken(req: any, res: any, next: any) {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied, token missing' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

async function isAdmin(req: any, res: any, next: any) {
  try {
    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: req.user.id });
    if (!user || !user.admin) return res.status(403).json({ error: 'Permission denied' });
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error verifying admin' });
  }
}

async function checkSuspended(req: any, res: any, next: any) {
  try {
    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: req.user.id });
    if (user && user.suspended) {
      return res.status(403).json({ error: 'Account suspended. Please contact administrator.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error checking account status' });
  }
}

// -------------------- INIT ADMIN DATABASE -------------------- //
async function initAdminORM() {
  try {
    orm = await MikroORM.init(config);
    console.log('✅ Admin database connected.');
  } catch (err) {
    console.error('❌ Failed to connect to admin database:', err);
    process.exit(1);
  }
}

// -------------------- USER FOLDERS MANAGEMENT -------------------- //

// Ensure user folder structure exists
async function ensureUserFolderStructure(userId: number) {
  try {
    const basePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;
    
    console.log(`📁 Ensuring folder structure for user ${userId} at: ${basePath}`);

    // Create main folder if it doesn't exist
    if (!fs.existsSync(basePath)) {
      await fsPromises.mkdir(basePath, { recursive: true });
      console.log(`✅ Created main folder: ${basePath}`);
    }

    // Define required folders and files
    const structure = [
      { path: 'archive', type: 'folder' },
      { path: 'images-products', type: 'folder' },
      { path: 'invoices', type: 'folder' },
      { path: 'data.json', type: 'file' }
    ];

    for (const item of structure) {
      const fullPath = path.join(basePath, item.path);
      
      if (item.type === 'folder') {
        if (!fs.existsSync(fullPath)) {
          await fsPromises.mkdir(fullPath, { recursive: true });
          console.log(`✅ Created folder: ${fullPath}`);
        } else {
          console.log(`📁 Folder already exists: ${fullPath}`);
        }
      } else if (item.type === 'file') {
        if (!fs.existsSync(fullPath)) {
          const initialData = {
            userId: userId,
            createdAt: new Date().toISOString(),
            storeInfo: {
              name: "",
              address: "",
              phone: "",
              email: ""
            },
            settings: {
              currency: "EUR",
              language: "en",
              taxRate: 0
            },
            lastUpdated: new Date().toISOString()
          };
          await fsPromises.writeFile(fullPath, JSON.stringify(initialData, null, 2));
          console.log(`✅ Created file: ${fullPath}`);
        } else {
          console.log(`📄 File already exists: ${fullPath}`);
        }
      }
    }

    console.log(`✅ Folder structure verified for user ${userId}`);
    return true;
  } catch (err) {
    console.error('❌ Error ensuring user folder structure:', err);
    throw err;
  }
}

// Move a file into archive folder
async function archiveUserDocument(userId: number, fileName: string) {
  try {
    // Ensure folder structure exists first
    await ensureUserFolderStructure(userId);

    const userFolder = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;
    const archiveFolder = path.join(userFolder, 'archive');

    const srcPath = path.join(userFolder, fileName);
    const destPath = path.join(archiveFolder, fileName);

    if (!fs.existsSync(srcPath)) throw new Error('File does not exist');
    
    await fsPromises.rename(srcPath, destPath);
    console.log(`✅ Archived file: ${fileName} for user ${userId}`);
  } catch (err) {
    console.error('❌ Error archiving document:', err);
    throw err;
  }
}

// -------------------- USER ROUTES -------------------- //
// Register user
app.post('/users', async (req, res) => {
  try {
    const em = orm.em.fork();
    const { username, email, password, birthdate, name, surname, phone_number } = req.body;

    const existing = await em.findOne(UserData, { email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_HASH) || 10);

    const newUser = em.create(UserData, {
      username,
      email,
      password: hashedPassword,
      birthdate: new Date(birthdate),
      expired: false,
      suspended: false,
      name,
      surname,
      phone_number,
      admin: false,
    });

    await em.persistAndFlush(newUser);

    // Create tenant tables and folders
    const usersOrm = await MikroORM.init(usersConfig);
    await createUserTenantTables(newUser.id, usersOrm);
    
    // Create complete folder structure
    await ensureUserFolderStructure(newUser.id);

    // Create JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Set token in httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, username: newUser.username },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user, tenant tables, or folders' });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const em = orm.em.fork();
    const { email, password } = req.body;

    const user = await em.findOne(UserData, { email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.suspended) return res.status(403).json({ error: 'Account suspended. Please contact administrator.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

    // Ensure folder structure exists on login (in case it was deleted/missing)
    try {
      await ensureUserFolderStructure(user.id);
    } catch (folderErr) {
      console.error('Warning: Could not ensure folder structure on login:', folderErr);
      // Continue with login even if folder creation fails
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        username: user.username,
        phone_number: user.phone_number,
        admin: user.admin,
        suspended: user.suspended,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
app.get('/api/me', authenticateToken, checkSuspended, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: req.user?.id });
    if (!user) return res.status(401).json({ error: 'User not found' });

    res.json({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      username: user.username,
      phone_number: user.phone_number,
      admin: user.admin,
      suspended: user.suspended,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user' });
  }
});

// -------------------- ADMIN USER MANAGEMENT ROUTES -------------------- //

// Get all users
app.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const em = orm.em.fork();
    const users = await em.find(UserData, {});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspend user - FIXED with raw SQL
app.post('/admin/users/:id/suspend', authenticateToken, isAdmin, async (req: Request, res: Response) => {
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

    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: userId });
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

    // Use raw SQL to avoid updated_at issues
    const conn = em.getConnection();
    await conn.execute(`UPDATE user_data SET suspended = true WHERE id = ?`, [userId]);

    console.log(`✅ User ${userId} suspended by admin`);
    res.json({ message: `User ${userId} has been suspended` });

  } catch (err) {
    console.error('❌ Suspend user error:', err);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Unsuspend user - FIXED with raw SQL
app.post('/admin/users/:id/unsuspend', authenticateToken, isAdmin, async (req: Request, res: Response) => {
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

    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: userId });
    if (!user) {
      console.log(`❌ User ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.suspended) {
      console.log(`ℹ️ User ${userId} is not suspended`);
      return res.status(400).json({ error: 'User is not suspended' });
    }

    // Use raw SQL to avoid updated_at issues
    const conn = em.getConnection();
    await conn.execute(`UPDATE user_data SET suspended = false WHERE id = ?`, [userId]);

    console.log(`✅ User ${userId} unsuspended by admin`);
    res.json({ message: `User ${userId} has been unsuspended` });

  } catch (err) {
    console.error('❌ Unsuspend user error:', err);
    res.status(500).json({ error: 'Failed to unsuspend user' });
  }
});

// Delete user (permanent) - FIXED
app.delete('/admin/users/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
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

    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: userId });
    if (!user) {
      console.log(`❌ User ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.admin) {
      console.log(`❌ Attempted to delete admin user ${userId}`);
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Drop tenant tables
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    const tables = ['customers', 'orders', 'products', 'stocks', 'invoices', 'paymentlogs'];

    for (const table of tables) {
      const tableName = `${table}_${userId}`;
      await conn.execute(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
      console.log(`✅ Dropped table: ${tableName}`);
    }

    // Delete user folders
    const storePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;
    if (fs.existsSync(storePath)) {
      await fsPromises.rm(storePath, { recursive: true, force: true });
      console.log(`✅ Deleted folder: ${storePath}`);
    }

    // Delete user from admin database - use native delete to avoid updated_at issues
    await em.nativeDelete(UserData, { id: userId });
    
    console.log(`✅ User ${userId} permanently deleted by admin`);
    res.json({ message: `User ${userId} has been permanently deleted` });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// -------------------- ADMIN FILE OPERATIONS -------------------- //

// Get list of files and folders for a user
app.get("/admin/store/:id", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    
    // Ensure folder structure exists before reading
    try {
      await ensureUserFolderStructure(userId);
    } catch (folderErr) {
      console.error(`Warning: Could not ensure folder structure for user ${userId}:`, folderErr);
      // Continue even if folder creation fails
    }
    
    const storePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;

    console.log(`🔍 Looking for store folder at: ${storePath}`);
    console.log(`📁 Folder exists: ${fs.existsSync(storePath)}`);

    if (!fs.existsSync(storePath)) {
      console.log(`❌ Store folder does not exist: ${storePath}`);
      return res.json([]);
    }

    // Read all files and folders recursively
    function readFilesRecursively(dir: string, baseDir: string = dir): any[] {
      const items = fs.readdirSync(dir);
      const result: any[] = [];

      for (const item of items) {
        // Skip archive folder
        if (item === 'archive') continue;
        
        const fullPath = path.join(dir, item);
        const relativePath = path.relative(baseDir, fullPath);
        const stats = fs.statSync(fullPath);
        
        const itemInfo = {
          name: item,
          path: relativePath,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          size: stats.size,
          children: [] as any[]
        };

        if (stats.isDirectory()) {
          // Recursively read subdirectory (except archive)
          itemInfo.children = readFilesRecursively(fullPath, baseDir);
          result.push(itemInfo);
        } else {
          // Add file
          result.push(itemInfo);
        }
      }

      return result;
    }

    const fileStructure = readFilesRecursively(storePath);
    console.log(`📁 Found ${fileStructure.length} items for user ${userId}`);
    
    res.json(fileStructure);
  } catch (err) {
    console.error("Error reading store folder:", err);
    res.status(500).json({ error: "Failed to read store folder" });
  }
});

// Preview file content
app.get("/admin/store/:id/preview", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const fileName = req.query.file as string;
    
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const storePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;
    const filePath = path.join(storePath, fileName);

    // Security check - prevent directory traversal
    if (!filePath.startsWith(storePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if it's actually a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    // Check file size (limit to 5MB for preview)
    if (stats.size > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large for preview (max 5MB)' });
    }

    // Get file extension to determine if it's text-based
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = ['.txt', '.js', '.ts', '.json', '.xml', '.html', '.css', '.csv', '.log', '.md', '.yml', '.yaml'];
    
    if (!textExtensions.includes(ext)) {
      return res.status(400).json({ error: 'File type not supported for preview' });
    }

    // Read file content as text
    const content = await fsPromises.readFile(filePath, 'utf-8');
    
    res.json({
      name: fileName,
      content: content,
      size: stats.size,
      type: ext
    });

  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: 'Failed to preview file' });
  }
});

// Download individual file
app.get("/admin/store/:id/download", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const fileName = req.query.file as string;
    
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    const storePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;
    const filePath = path.join(storePath, fileName);

    // Security check - prevent directory traversal
    if (!filePath.startsWith(storePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if it's actually a file
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    // Get file info for headers
    const baseName = path.basename(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);

    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Export everything as ZIP (including folders)
app.get("/admin/export/:id", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const storePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;

    // Ensure folder structure exists before export
    try {
      await ensureUserFolderStructure(userId);
    } catch (folderErr) {
      console.error(`Warning: Could not ensure folder structure for user ${userId} before export:`, folderErr);
    }

    if (!fs.existsSync(storePath)) {
      return res.status(404).json({ error: 'No store folder found for this user' });
    }

    // Set ZIP response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="user-${userId}-export.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create archive' });
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add store files to archive (including folder structure)
    function addDirectoryToArchive(dirPath: string, archivePath: string = '') {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        // Skip archive folder
        if (item === 'archive') continue;
        
        const fullPath = path.join(dirPath, item);
        const relativePath = path.join(archivePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          // Add directory and its contents recursively
          addDirectoryToArchive(fullPath, relativePath);
        } else {
          // Add file to archive
          archive.file(fullPath, { name: `store/${relativePath}` });
          console.log(`✅ Added to ZIP: store/${relativePath}`);
        }
      }
    }

    // Add store files with folder structure
    addDirectoryToArchive(storePath);

    // Add tenant database tables as JSON files
    try {
      const usersOrm = await MikroORM.init(usersConfig);
      const conn = usersOrm.em.getConnection();
      const tables = ['customers', 'orders', 'products', 'stocks', 'invoices', 'paymentlogs'];

      for (const table of tables) {
        const tableName = `${table}_${userId}`;
        try {
          // Check if table exists
          const tableExists = await conn.execute(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = '${tableName}'
            );
          `);
          
          if (tableExists[0].exists) {
            const rows = await conn.execute(`SELECT * FROM ${tableName}`);
            const tableData = {
              table: tableName,
              count: rows.length,
              data: rows
            };
            archive.append(JSON.stringify(tableData, null, 2), { name: `database/${table}.json` });
            console.log(`✅ Added to ZIP: database/${table}.json`);
          }
        } catch (tableErr) {
          console.log(`Table ${tableName} not accessible, skipping...`);
        }
      }

      await usersOrm.close();
    } catch (dbErr) {
      console.log('Database export skipped:', dbErr);
    }

    // Finalize the archive
    await archive.finalize();
    console.log(`✅ ZIP export completed for user ${userId}`);

  } catch (err) {
    console.error('Export error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export data' });
    }
  }
});

// -------------------- Admin: Tenant Table Contents -------------------- //
app.get("/admin/tenant/:id/:table", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const table = req.params.table;

    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();

    // Table format: {table}_{userId}
    const tableName = `${table}_${userId}`;

    const rows = await conn.execute(`SELECT * FROM ${tableName} LIMIT 100;`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tenant table" });
  }
});

// Admin: Get tenant table columns
app.get("/admin/tenant/:id/:table/columns", authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const table = req.params.table;
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    const tableName = `${table}_${userId}`;

    const result = await conn.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}';
    `);

    const columns = result.map((row: any) => row.column_name);
    res.json(columns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tenant table columns" });
  }
});

// -------------------- PAYMENT ROUTES -------------------- //
app.post('/payments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const em = orm.em.fork();
    const newPayment = em.create(PaymentData, req.body);
    await em.persistAndFlush(newPayment);
    res.status(201).json(newPayment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

app.get('/payments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const em = orm.em.fork();
    const payments = await em.find(PaymentData, {});
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- SUBSCRIPTION ROUTES -------------------- //
app.post('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const em = orm.em.fork();
    const newSub = em.create(SubscriptionData, req.body);
    await em.persistAndFlush(newSub);
    res.status(201).json(newSub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

app.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const em = orm.em.fork();
    const subs = await em.find(SubscriptionData, {});
    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -------------------- ARCHIVE DOCUMENT ENDPOINT -------------------- //
app.post('/users/:id/archive', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });

    await archiveUserDocument(userId, fileName);
    res.json({ message: `File ${fileName} archived successfully for user ${userId}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive document' });
  }
});

// -------------------- FOLDER MANAGEMENT ROUTES -------------------- //

// Force folder structure creation for a user
app.post('/admin/users/:id/ensure-folders', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    
    console.log(`🔧 Manually ensuring folder structure for user ${userId}`);
    await ensureUserFolderStructure(userId);
    
    res.json({ message: `Folder structure ensured for user ${userId}` });
  } catch (err) {
    console.error('Error ensuring folders:', err);
    res.status(500).json({ error: 'Failed to ensure folder structure' });
  }
});

// Check folder structure for a user
app.get('/admin/users/:id/folders', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const basePath = `/home/cipriankali/Desktop/KapryGest/backend/db/store/${userId}`;
    
    const structure = {
      mainFolder: { exists: fs.existsSync(basePath), path: basePath },
      archive: { exists: fs.existsSync(path.join(basePath, 'archive')), path: path.join(basePath, 'archive') },
      imagesProducts: { exists: fs.existsSync(path.join(basePath, 'images-products')), path: path.join(basePath, 'images-products') },
      invoices: { exists: fs.existsSync(path.join(basePath, 'invoices')), path: path.join(basePath, 'invoices') },
      dataJson: { exists: fs.existsSync(path.join(basePath, 'data.json')), path: path.join(basePath, 'data.json') }
    };
    
    res.json(structure);
  } catch (err) {
    console.error('Error checking folders:', err);
    res.status(500).json({ error: 'Failed to check folder structure' });
  }
});

// -------------------- DEBUG ROUTE -------------------- //
app.get('/admin/debug/user/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const em = orm.em.fork();
    const user = await em.findOne(UserData, { id: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      suspended: user.suspended,
      admin: user.admin
    });
  } catch (err) {
    console.error('Debug user error:', err);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// -------------------- ROOT ROUTE -------------------- //
app.get('/', (req, res) => res.send('Server is up and running!'));

// -------------------- START SERVER -------------------- //
async function main() {
  await initAdminORM();
  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main();