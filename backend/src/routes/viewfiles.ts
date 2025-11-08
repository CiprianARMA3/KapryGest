import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { authenticateToken, isAdmin } from '../middleware/auth';

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

// Get folder structure
router.get('/structure', authenticateToken, async (req, res) => {
  try {
    const { basePath = process.cwd(), relativePath = '' } = req.query;
    
    if (typeof basePath !== 'string' || typeof relativePath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    // Security check - ensure we're not accessing unsafe paths
    if (!isSafePath(process.cwd(), basePath)) {
      return res.status(403).json({ error: 'Access to this path is not allowed' });
    }

    const fullPath = path.join(basePath, relativePath);
    
    // Check if path exists and is accessible
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'Path not found or inaccessible' });
    }

    const stats = await fs.stat(fullPath);
    
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const items = await fs.readdir(fullPath);
    const fileSystemItems: FileSystemItem[] = [];

    for (const item of items) {
      try {
        const itemPath = path.join(fullPath, item);
        const itemStats = await fs.stat(itemPath);
        
        const fileItem: FileSystemItem = {
          name: item,
          path: path.join(relativePath, item),
          isDirectory: itemStats.isDirectory(),
          isFile: itemStats.isFile(),
          size: itemStats.size,
          modified: itemStats.mtime
        };

        // If it's a directory, get immediate children count (optional)
        if (itemStats.isDirectory()) {
          try {
            const children = await fs.readdir(itemPath);
            fileItem.children = children.slice(0, 10).map(child => ({
              name: child,
              path: path.join(relativePath, item, child),
              isDirectory: false, // We'll set this properly if needed
              isFile: true,
              size: 0,
              modified: new Date()
            }));
          } catch (error) {
            fileItem.children = [];
          }
        }

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
      basePath: basePath,
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

// Get file content/preview
router.get('/preview', authenticateToken, async (req, res) => {
  try {
    const { filePath, basePath = process.cwd(), maxSize = 10485760 } = req.query; // 10MB default max size

    if (typeof filePath !== 'string' || typeof basePath !== 'string') {
      return res.status(400).json({ error: 'Invalid file path parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || !isSafePath(basePath, filePath)) {
      return res.status(403).json({ error: 'Access to this file is not allowed' });
    }

    const fullPath = path.join(basePath, filePath);
    
    // Check if file exists and is accessible
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found or inaccessible' });
    }

    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    // Check file size limit
    const maxSizeBytes = typeof maxSize === 'string' ? parseInt(maxSize) : Number(maxSize);
    if (stats.size > maxSizeBytes) {
      return res.status(413).json({ 
        error: `File too large. Maximum size is ${maxSizeBytes} bytes.`,
        size: stats.size,
        maxSize: maxSizeBytes
      });
    }

    const mimeType = getMimeType(fullPath);
    const { content, encoding } = await readFileContent(fullPath);

    const fileContent: FileContent = {
      name: path.basename(fullPath),
      path: filePath,
      content: content,
      type: mimeType.split('/')[0], // 'text', 'image', 'application', etc.
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

// Create new file or directory
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { basePath = process.cwd(), path: itemPath, type = 'file', content = '' } = req.body;

    if (typeof basePath !== 'string' || typeof itemPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || !isSafePath(basePath, itemPath)) {
      return res.status(403).json({ error: 'Access to this location is not allowed' });
    }

    const fullPath = path.join(basePath, itemPath);

    // Check if item already exists
    try {
      await fs.access(fullPath);
      return res.status(409).json({ error: 'Item already exists' });
    } catch (error) {
      // Item doesn't exist, which is what we want
    }

    if (type === 'directory') {
      await fs.mkdir(fullPath, { recursive: true });
      res.json({ message: 'Directory created successfully', path: itemPath });
    } else if (type === 'file') {
      // Ensure parent directory exists
      const parentDir = path.dirname(fullPath);
      await fs.mkdir(parentDir, { recursive: true });
      
      await fs.writeFile(fullPath, content, 'utf-8');
      res.json({ message: 'File created successfully', path: itemPath });
    } else {
      res.status(400).json({ error: 'Invalid type. Must be "file" or "directory"' });
    }

  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update file content
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { basePath = process.cwd(), path: filePath, content } = req.body;

    if (typeof basePath !== 'string' || typeof filePath !== 'string' || content === undefined) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || !isSafePath(basePath, filePath)) {
      return res.status(403).json({ error: 'Access to this file is not allowed' });
    }

    const fullPath = path.join(basePath, filePath);

    // Check if file exists and is accessible
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found or inaccessible' });
    }

    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Path is not a file' });
    }

    await fs.writeFile(fullPath, content, 'utf-8');
    
    // Get updated stats
    const updatedStats = await fs.stat(fullPath);
    
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

// Rename file or directory
router.put('/rename', authenticateToken, async (req, res) => {
  try {
    const { basePath = process.cwd(), oldPath, newPath } = req.body;

    if (typeof basePath !== 'string' || typeof oldPath !== 'string' || typeof newPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || 
        !isSafePath(basePath, oldPath) || 
        !isSafePath(basePath, newPath)) {
      return res.status(403).json({ error: 'Access to these paths is not allowed' });
    }

    const fullOldPath = path.join(basePath, oldPath);
    const fullNewPath = path.join(basePath, newPath);

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

// Delete file or directory
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    // Get parameters from request body (for DELETE with body)
    const { basePath = process.cwd(), path: itemPath, recursive = false } = req.body;

    // OR if using query parameters, use this instead:
    // const { basePath = process.cwd(), path: itemPath, recursive = false } = req.query;

    console.log('Delete request:', { basePath, itemPath, recursive }); // Add this for debugging

    if (typeof basePath !== 'string' || typeof itemPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || !isSafePath(basePath, itemPath)) {
      return res.status(403).json({ error: 'Access to this item is not allowed' });
    }

    const fullPath = path.join(basePath, itemPath);

    // Check if item exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      if (recursive) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        // Check if directory is empty
        const items = await fs.readdir(fullPath);
        if (items.length > 0) {
          return res.status(400).json({ 
            error: 'Directory is not empty. Use recursive=true to delete non-empty directories.' 
          });
        }
        await fs.rmdir(fullPath);
      }
    } else {
      await fs.unlink(fullPath);
    }

    res.json({ message: 'Item deleted successfully', path: itemPath });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Upload file
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    // Note: For file uploads, you'll need to use multer or similar middleware
    // This is a simplified version - you might want to implement proper file upload handling
    res.status(501).json({ error: 'File upload endpoint not implemented. Use multipart/form-data with proper file upload middleware.' });
  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ error: 'Failed to handle upload' });
  }
});

// Copy file or directory
router.post('/copy', authenticateToken, async (req, res) => {
  try {
    const { basePath = process.cwd(), sourcePath, destinationPath } = req.body;

    if (typeof basePath !== 'string' || typeof sourcePath !== 'string' || typeof destinationPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || 
        !isSafePath(basePath, sourcePath) || 
        !isSafePath(basePath, destinationPath)) {
      return res.status(403).json({ error: 'Access to these paths is not allowed' });
    }

    const fullSourcePath = path.join(basePath, sourcePath);
    const fullDestPath = path.join(basePath, destinationPath);

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

// Move file or directory
router.post('/move', authenticateToken, async (req, res) => {
  try {
    const { basePath = process.cwd(), sourcePath, destinationPath } = req.body;

    if (typeof basePath !== 'string' || typeof sourcePath !== 'string' || typeof destinationPath !== 'string') {
      return res.status(400).json({ error: 'Invalid path parameters' });
    }

    // Security check
    if (!isSafePath(process.cwd(), basePath) || 
        !isSafePath(basePath, sourcePath) || 
        !isSafePath(basePath, destinationPath)) {
      return res.status(403).json({ error: 'Access to these paths is not allowed' });
    }

    const fullSourcePath = path.join(basePath, sourcePath);
    const fullDestPath = path.join(basePath, destinationPath);

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