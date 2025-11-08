import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Interface for file system items
interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: Date;
  children?: FileSystemItem[];
}

// Interface for file content
interface FileContent {
  name: string;
  path: string;
  content: string;
  type: string;
  mimeType: string;
  size: number;
  encoding?: string;
}

const getUserStorePath = (userId: number, relativePath: string = ''): string => {
  return path.join('/home/cipriankali/Desktop/KapryGest/backend/db/store', userId.toString(), relativePath);
};

// Helper function to check if path is safe
const isSafePath = (basePath: string, targetPath: string): boolean => {
  const resolvedPath = path.resolve(basePath, targetPath);
  return resolvedPath.startsWith(path.resolve(basePath));
};

// Helper function to get file MIME type
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Helper function to read file with appropriate encoding
const readFileContent = async (filePath: string): Promise<{ content: string; encoding: string }> => {
  try {
    // Try UTF-8 first
    const content = await fs.readFile(filePath, 'utf-8');
    return { content, encoding: 'utf-8' };
  } catch (error) {
    // If UTF-8 fails, read as binary and encode as base64
    const buffer = await fs.readFile(filePath);
    return { content: buffer.toString('base64'), encoding: 'base64' };
  }
};

// Configure multer for file uploads - UPDATED FOR USER STORE
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user?.id;
      if (!userId) {
        return cb(new Error('User not authenticated'), '');
      }

      const { currentPath = '' } = req.body;
      const storePath = getUserStorePath(userId, currentPath);
      
      // Ensure directory exists
      await fs.mkdir(storePath, { recursive: true });
      
      console.log('💾 Storing file for user', userId, 'in:', storePath);
      cb(null, storePath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, sanitizedName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Get folder structure - UPDATED FOR USER STORE
router.get('/structure', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { relativePath = '' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof relativePath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    const storePath = getUserStorePath(userId, relativePath);
    
    console.log('📁 Loading folder structure for user', userId, 'from:', storePath);

    // Check if path exists and is accessible
    try {
      await fs.access(storePath);
    } catch (error) {
      // If path doesn't exist, create it and return empty
      await fs.mkdir(storePath, { recursive: true });
      return res.json({
        path: relativePath,
        basePath: getUserStorePath(userId),
        items: [],
        totalItems: 0,
        totalDirectories: 0,
        totalFiles: 0
      });
    }

    const stats = await fs.stat(storePath);
    
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const items = await fs.readdir(storePath);
    const fileSystemItems: FileSystemItem[] = [];

    for (const item of items) {
      try {
        const itemPath = path.join(storePath, item);
        const itemStats = await fs.stat(itemPath);
        
        const fileItem: FileSystemItem = {
          name: item,
          path: path.join(relativePath, item),
          isDirectory: itemStats.isDirectory(),
          isFile: itemStats.isFile(),
          size: itemStats.size,
          modified: itemStats.mtime
        };

        fileSystemItems.push(fileItem);
      } catch (error) {
        console.warn(`Could not access ${item}:`, error);
        // Continue with other items
      }
    }

    // Sort: directories first, then files, both alphabetically
    fileSystemItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      path: relativePath,
      basePath: getUserStorePath(userId),
      items: fileSystemItems,
      totalItems: fileSystemItems.length,
      totalDirectories: fileSystemItems.filter(item => item.isDirectory).length,
      totalFiles: fileSystemItems.filter(item => item.isFile).length
    });

  } catch (error) {
    console.error('Error reading folder structure:', error);
    res.status(500).json({ error: 'Failed to read folder structure' });
  }
});

// Get file content/preview - UPDATED FOR USER STORE
router.get('/preview', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { filePath, maxSize = 10485760 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Invalid file path parameters' });
    }

    const storePath = getUserStorePath(userId, filePath);
    
    console.log('👀 Previewing file for user', userId, 'from:', storePath);

    // Check if file exists and is accessible
    try {
      await fs.access(storePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found or inaccessible' });
    }

    const stats = await fs.stat(storePath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    // Check file size limit
    const maxSizeBytes = Number(maxSize);
    if (stats.size > maxSizeBytes) {
      return res.status(413).json({ 
        error: `File too large. Maximum size is ${maxSizeBytes} bytes.`,
        size: stats.size,
        maxSize: maxSizeBytes
      });
    }

    const mimeType = getMimeType(storePath);
    const { content, encoding } = await readFileContent(storePath);

    const fileContent: FileContent = {
      name: path.basename(storePath),
      path: filePath,
      content: content,
      type: mimeType.split('/')[0],
      mimeType: mimeType,
      size: stats.size,
      encoding: encoding
    };

    res.json(fileContent);

  } catch (error) {
    console.error('Error reading file content:', error);
    res.status(500).json({ error: 'Failed to read file content' });
  }
});

// Create new file or directory - UPDATED FOR USER STORE
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { path: itemPath, type = 'file', content = '' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof itemPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    const storePath = getUserStorePath(userId, itemPath);

    console.log('🆕 Creating item for user', userId, 'at:', storePath);

    // Check if item already exists
    try {
      await fs.access(storePath);
      return res.status(409).json({ error: 'Item already exists' });
    } catch (error) {
      // Item doesn't exist, which is what we want
    }

    if (type === 'directory') {
      await fs.mkdir(storePath, { recursive: true });
      res.json({ message: 'Directory created successfully', path: itemPath });
    } else if (type === 'file') {
      // Ensure parent directory exists
      const parentDir = path.dirname(storePath);
      await fs.mkdir(parentDir, { recursive: true });
      
      await fs.writeFile(storePath, content, 'utf-8');
      res.json({ message: 'File created successfully', path: itemPath });
    } else {
      res.status(400).json({ error: 'Invalid type. Must be "file" or "directory"' });
    }

  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update file content - UPDATED FOR USER STORE
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { path: filePath, content } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof filePath !== 'string' || content === undefined) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const storePath = getUserStorePath(userId, filePath);

    console.log('✏️ Updating file for user', userId, 'at:', storePath);

    // Check if file exists and is accessible
    try {
      await fs.access(storePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found or inaccessible' });
    }

    const stats = await fs.stat(storePath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    await fs.writeFile(storePath, content, 'utf-8');
    
    // Get updated stats
    const updatedStats = await fs.stat(storePath);
    
    res.json({ 
      message: 'File updated successfully', 
      path: filePath,
      size: updatedStats.size,
      modified: updatedStats.mtime
    });

  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Rename file or directory - UPDATED FOR USER STORE
router.put('/rename', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { oldPath, newPath } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof oldPath !== 'string' || typeof newPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    const fullOldPath = getUserStorePath(userId, oldPath);
    const fullNewPath = getUserStorePath(userId, newPath);

    console.log('🔄 Renaming item for user', userId, 'from:', fullOldPath, 'to:', fullNewPath);

    // Check if source exists
    try {
      await fs.access(fullOldPath);
    } catch (error) {
      return res.status(404).json({ error: 'Source item not found' });
    }

    // Check if destination already exists
    try {
      await fs.access(fullNewPath);
      return res.status(409).json({ error: 'Destination item already exists' });
    } catch (error) {
      // Destination doesn't exist, which is good
    }

    await fs.rename(fullOldPath, fullNewPath);
    res.json({ message: 'Item renamed successfully', oldPath, newPath });

  } catch (error) {
    console.error('Error renaming item:', error);
    res.status(500).json({ error: 'Failed to rename item' });
  }
});

// Delete file or directory - UPDATED FOR USER STORE
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { path: itemPath, recursive = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof itemPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    const storePath = getUserStorePath(userId, itemPath);

    console.log('🗑️ Deleting item for user', userId, 'from:', storePath);

    // Check if item exists
    try {
      await fs.access(storePath);
    } catch (error) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const stats = await fs.stat(storePath);

    if (stats.isDirectory()) {
      if (recursive) {
        await fs.rm(storePath, { recursive: true, force: true });
      } else {
        // Check if directory is empty
        const items = await fs.readdir(storePath);
        if (items.length > 0) {
          return res.status(400).json({ 
            error: 'Directory is not empty. Use recursive=true to delete non-empty directories.' 
          });
        }
        await fs.rmdir(storePath);
      }
    } else {
      await fs.unlink(storePath);
    }

    res.json({ message: 'Item deleted successfully', path: itemPath });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Single file upload - UPDATED FOR USER STORE
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPath = '' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('✅ File uploaded for user', userId, 'to:', getUserStorePath(userId, currentPath));

    res.json({
      message: 'File uploaded successfully',
      path: path.join(currentPath, req.file.filename),
      filename: req.file.filename,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Multiple files upload - UPDATED FOR USER STORE
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPath = '' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];
    const paths = files.map(file => path.join(currentPath, file.filename));

    console.log('✅', files.length, 'files uploaded for user', userId, 'to:', getUserStorePath(userId, currentPath));

    res.json({
      message: `${files.length} files uploaded successfully`,
      paths: paths,
      files: files.map(file => ({
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      }))
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Copy file or directory - UPDATED FOR USER STORE
router.post('/copy', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { sourcePath, destinationPath } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof sourcePath !== 'string' || typeof destinationPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    const fullSourcePath = getUserStorePath(userId, sourcePath);
    const fullDestPath = getUserStorePath(userId, destinationPath);

    console.log('📋 Copying item for user', userId, 'from:', fullSourcePath, 'to:', fullDestPath);

    // Check if source exists
    try {
      await fs.access(fullSourcePath);
    } catch (error) {
      return res.status(404).json({ error: 'Source item not found' });
    }

    // Check if destination already exists
    try {
      await fs.access(fullDestPath);
      return res.status(409).json({ error: 'Destination item already exists' });
    } catch (error) {
      // Destination doesn't exist, which is good
    }

    const stats = await fs.stat(fullSourcePath);

    if (stats.isDirectory()) {
      // For directories, we need to recursively copy
      await copyDirectory(fullSourcePath, fullDestPath);
    } else {
      // For files, simple copy
      await fs.copyFile(fullSourcePath, fullDestPath);
    }

    res.json({ message: 'Item copied successfully', sourcePath, destinationPath });

  } catch (error) {
    console.error('Error copying item:', error);
    res.status(500).json({ error: 'Failed to copy item' });
  }
});

// Move file or directory - UPDATED FOR USER STORE
router.post('/move', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { sourcePath, destinationPath } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (typeof sourcePath !== 'string' || typeof destinationPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    const fullSourcePath = getUserStorePath(userId, sourcePath);
    const fullDestPath = getUserStorePath(userId, destinationPath);

    console.log('🚚 Moving item for user', userId, 'from:', fullSourcePath, 'to:', fullDestPath);

    // Check if source exists
    try {
      await fs.access(fullSourcePath);
    } catch (error) {
      return res.status(404).json({ error: 'Source item not found' });
    }

    // Check if destination already exists
    try {
      await fs.access(fullDestPath);
      return res.status(409).json({ error: 'Destination item already exists' });
    } catch (error) {
      // Destination doesn't exist, which is good
    }

    await fs.rename(fullSourcePath, fullDestPath);
    res.json({ message: 'Item moved successfully', sourcePath, destinationPath });

  } catch (error) {
    console.error('Error moving item:', error);
    res.status(500).json({ error: 'Failed to move item' });
  }
});

// Helper function to recursively copy directories
async function copyDirectory(source: string, destination: string): Promise<void> {
  await fs.mkdir(destination, { recursive: true });
  const items = await fs.readdir(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    const stats = await fs.stat(sourcePath);
    
    if (stats.isDirectory()) {
      await copyDirectory(sourcePath, destPath);
    } else {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}

export default router;