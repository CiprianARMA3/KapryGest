import { Request, Response } from 'express';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { BASE_STORE_PATH } from '../config/auth';
import { FileService } from '../services/fileService';
import { MikroORM } from '@mikro-orm/postgresql';
import usersConfig from '../config/users-orm.config';

export class FileController {
  static async getUserStore(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      
      // Ensure folder structure exists before reading
      try {
        await FileService.ensureUserFolderStructure(userId);
      } catch (folderErr) {
        console.error(`Warning: Could not ensure folder structure for user ${userId}:`, folderErr);
      }
      
      const storePath = `${BASE_STORE_PATH}/${userId}`;

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
            // Recursively read subdirectory
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
  }

  static async previewFile(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const fileName = req.query.file as string;
      
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const storePath = `${BASE_STORE_PATH}/${userId}`;
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
      const content = await FileService.readFileContent(filePath);
      
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
  }

  static async downloadFile(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const fileName = req.query.file as string;
      
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const storePath = `${BASE_STORE_PATH}/${userId}`;
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
  }

  static async exportUserData(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const storePath = `${BASE_STORE_PATH}/${userId}`;

      // Ensure folder structure exists before export
      try {
        await FileService.ensureUserFolderStructure(userId);
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
        const tables = ['customers', 'orders', 'products', 'stocks', 'invoices', 'paymentlogs', 'subordinateworkers'];

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
  }
}