import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { BASE_STORE_PATH } from '../config/auth';

export class FileService {
  static async ensureUserFolderStructure(userId: number): Promise<boolean> {
    try {
      const basePath = `${BASE_STORE_PATH}/${userId}`;
      
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
        { path: 'data.json', type: 'file' },
      ];

      for (const item of structure) {
        const fullPath = path.join(basePath, item.path);
        
        if (item.type === 'folder') {
          if (!fs.existsSync(fullPath)) {
            await fsPromises.mkdir(fullPath, { recursive: true });
            console.log(`✅ Created folder: ${fullPath}`);
          }
        } else if (item.type === 'file') {
          if (!fs.existsSync(fullPath)) {
            let initialData: any;
            
            if (item.path === 'archive/data.json') {
              initialData = {
                userId: userId,
                createdAt: new Date().toISOString(),
                subordinateWorkers: {
                  totalCount: 0,
                  activeWorkers: [],
                  archivedWorkers: [],
                  permissionsHistory: [],
                  activityLogs: []
                },
                lastUpdated: new Date().toISOString()
              };
            } else {
              initialData = {
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
            }
            
            await fsPromises.writeFile(fullPath, JSON.stringify(initialData, null, 2));
            console.log(`✅ Created file: ${fullPath}`);
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

  static async deleteUserFolder(userId: number): Promise<void> {
    const storePath = `${BASE_STORE_PATH}/${userId}`;
    if (fs.existsSync(storePath)) {
      await fsPromises.rm(storePath, { recursive: true, force: true });
      console.log(`✅ Deleted folder: ${storePath}`);
    }
  }

  static async readFileContent(filePath: string): Promise<string> {
    return await fsPromises.readFile(filePath, 'utf-8');
  }

  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}