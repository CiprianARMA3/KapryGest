import React, { useState, useEffect } from 'react';
import { viewFilesAPI, fileSystemUtils } from '../../../lib/api';

interface FileManagerProps {
  basePath?: string;
}

const FileManager: React.FC<FileManagerProps> = ({ basePath = process.cwd() }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'file' | 'directory'>('file');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [itemToRename, setItemToRename] = useState<any>(null);
  const [newName, setNewName] = useState<string>('');

  // Load folder structure
  const loadFolder = async (path: string = '') => {
    setLoading(true);
    setError('');
    try {
      const structure = await viewFilesAPI.getFolderStructure(basePath, path);
      setFiles(structure.items);
      setCurrentPath(structure.path);
    } catch (err: any) {
      setError(err.message || 'Failed to load folder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolder();
  }, [basePath]);

  // Navigate to folder
  const navigateToFolder = (folderPath: string) => {
    loadFolder(folderPath);
  };

  // Navigate up
  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    loadFolder(parentPath);
  };

  // Preview file
  const previewFile = async (file: any) => {
    setLoading(true);
    setError('');
    try {
      const content = await viewFilesAPI.getFilePreview(file.path, basePath);
      setSelectedFile(file);
      setFileContent(content.content);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  // Save file content
  const saveFile = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError('');
    try {
      await viewFilesAPI.updateFile(basePath, selectedFile.path, fileContent);
      setIsEditing(false);
      setSuccess('File saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  // Create new item
  const createItem = async () => {
    if (!newItemName.trim()) return;
    
    setLoading(true);
    setError('');
    try {
      await viewFilesAPI.createItem(basePath, `${currentPath}/${newItemName}`, newItemType);
      setShowCreateModal(false);
      setNewItemName('');
      loadFolder(currentPath);
      setSuccess(`${newItemType === 'file' ? 'File' : 'Directory'} created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const deleteItem = async () => {
    if (!itemToDelete) return;
    
    setLoading(true);
    setError('');
    try {
      await viewFilesAPI.deleteItem(basePath, itemToDelete.path, itemToDelete.isDirectory);
      if (selectedFile?.path === itemToDelete.path) {
        setSelectedFile(null);
        setFileContent('');
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadFolder(currentPath);
      setSuccess('Item deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  // Rename item
  const renameItem = async () => {
    if (!itemToRename || !newName.trim() || newName === itemToRename.name) return;
    
    setLoading(true);
    setError('');
    try {
      const newPath = `${currentPath.split('/').slice(0, -1).join('/')}/${newName}`;
      await viewFilesAPI.renameItem(basePath, itemToRename.path, newPath);
      setShowRenameModal(false);
      setItemToRename(null);
      setNewName('');
      loadFolder(currentPath);
      setSuccess('Item renamed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to rename item');
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation
  const openDeleteModal = (item: any) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Open rename modal
  const openRenameModal = (item: any) => {
    setItemToRename(item);
    setNewName(item.name);
    setShowRenameModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-base-200 rounded-lg">
        <div>
          <h1 className="text-4xl font-bold text-base-content">File Manager</h1>
          <div className="text-m breadcrumbs">
            <ul>
              <li>
                <button 
                  onClick={() => loadFolder('')}
                  className="text-primary hover:text-primary-focus"
                >
                  Root "Store path"
                </button>
              </li>
              {currentPath.split('/').map((part, index, array) => (
                part && (
                  <li key={index}>
                    <button 
                      onClick={() => loadFolder(array.slice(0, index + 1).join('/'))}
                      className="text-primary hover:text-primary-focus"
                    >
                      {part}
                    </button>
                  </li>
                )
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
          <button 
            onClick={navigateUp}
            disabled={!currentPath}
            className="btn btn-outline btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Up
          </button>
          <button 
            onClick={() => loadFolder(currentPath)}
            className="btn btn-outline btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* File List */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">
              Files & Folders
              {loading && <span className="loading loading-spinner loading-sm"></span>}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra table-m">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.path} className="hover">
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {fileSystemUtils.getFileIcon(file)}
                          </span>
                          {file.isDirectory ? (
                            <button 
                              onClick={() => navigateToFolder(file.path)}
                              className="text-primary hover:text-primary-focus font-medium"
                            >
                              {file.name}
                            </button>
                          ) : (
                            <span className="font-medium">{file.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="text-m text-base-content/70">
                        {fileSystemUtils.formatFileSize(file.size)}
                      </td>
                      <td className="text-m text-base-content/70">
                        {fileSystemUtils.formatDate(file.modified)}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {file.isFile && fileSystemUtils.canPreview(file) && (
                            <button 
                              onClick={() => previewFile(file)}
                              className="btn btn-xs btn-outline"
                              title="Preview"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                          <button 
                            onClick={() => openRenameModal(file)}
                            className="btn btn-xs btn-outline"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openDeleteModal(file)}
                            className="btn btn-xs btn-error btn-outline"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {files.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="text-center text-base-content/70 py-8">
                        No files or folders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* File Preview/Editor */}
        {selectedFile && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body mt-[200px]">
              <div className="flex justify-between items-start mb-4">
                <h2 className="card-title">{selectedFile.name}</h2>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={saveFile}
                        className="btn btn-success btn-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        Save
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="btn btn-outline btn-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                </div>
              </div>
              
              <div className="bg-base-200 rounded-lg p-4">
                {isEditing ? (
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="textarea textarea-bordered w-full h-96 font-mono text-sm"
                    placeholder="File content..."
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm bg-base-100 p-4 rounded border">
                    {fileContent}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <div className={`modal ${showCreateModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Create New Item</h3>
          <div className="py-4 space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Enter file or folder name"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type</span>
              </label>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as 'file' | 'directory')}
                className="select select-bordered"
              >
                <option value="file">File</option>
                <option value="directory">Directory</option>
              </select>
            </div>
          </div>
          <div className="modal-action">
            <button 
              onClick={createItem}
              disabled={!newItemName.trim() || loading}
              className="btn btn-primary"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Create'}
            </button>
            <button 
              onClick={() => setShowCreateModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal ${showDeleteModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Delete</h3>
          <p className="py-4">
            Are you sure you want to delete "{itemToDelete?.name}"?
            {itemToDelete?.isDirectory && (
              <span className="block text-warning mt-2">
                This is a directory and all its contents will be deleted.
              </span>
            )}
          </p>
          <div className="modal-action">
            <button 
              onClick={deleteItem}
              disabled={loading}
              className="btn btn-error"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Delete'}
            </button>
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <div className={`modal ${showRenameModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Rename Item</h3>
          <div className="py-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">New Name</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
                className="input input-bordered"
              />
            </div>
          </div>
          <div className="modal-action">
            <button 
              onClick={renameItem}
              disabled={!newName.trim() || newName === itemToRename?.name || loading}
              className="btn btn-primary"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Rename'}
            </button>
            <button 
              onClick={() => setShowRenameModal(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;