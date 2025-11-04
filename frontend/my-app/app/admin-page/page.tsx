"use client";

import React, { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  username: string;
  phone_number: string;
  admin: boolean;
  suspended: boolean;
}

interface FileContent {
  name: string;
  content: string;
  type: string;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  children: FileItem[];
}

interface SubordinateWorker {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone_number: number;
  role: string;
  password: string;
  permissions?: object;
  logs?: object;
  created_at: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [storeFiles, setStoreFiles] = useState<FileItem[]>([]);
  const [tenantData, setTenantData] = useState<Record<string, any[]>>({});
  const [tenantColumns, setTenantColumns] = useState<Record<string, string[]>>({});
  const [showTables, setShowTables] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // File operation states
  const [exporting, setExporting] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<FileContent | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);

  // Action modal states
  const [actionPassword, setActionPassword] = useState("");
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ type: 'suspend' | 'unsuspend' | 'delete', userId: number, userName: string } | null>(null);
  const [performingAction, setPerformingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Subordinate Workers states
  const [subordinateWorkers, setSubordinateWorkers] = useState<SubordinateWorker[]>([]);
  const [showSubordinateWorkers, setShowSubordinateWorkers] = useState(false);
  const [loadingSubordinates, setLoadingSubordinates] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch current admin user
  useEffect(() => {
    fetch(`${API_URL}/api/me`, { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject("Not authorized"))
      .then((user: User) => {
        if (!user.admin) window.location.href = "/main-page";
        else setCurrentUser(user);
      })
      .catch(() => window.location.href = "/login");
  }, [API_URL]);

  // Fetch all users
  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_URL}/users`, { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch users"))
      .then((users: User[]) => {
        setAllUsers(users);
        setFilteredUsers(users);
      })
      .catch(console.error);
  }, [currentUser, API_URL]);

  // Filter users
  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = allUsers.filter(u =>
      u.id.toString().includes(lower) ||
      u.name.toLowerCase().includes(lower) ||
      u.surname.toLowerCase().includes(lower) ||
      u.username.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower) ||
      u.phone_number.toLowerCase().includes(lower)
    );
    setFilteredUsers(filtered);
  }, [search, allUsers]);

  // Fetch store files and tenant tables when user is selected
  useEffect(() => {
    if (!selectedUserId) return;

    setStoreFiles([]);
    setTenantData({});
    setTenantColumns({});
    setExpandedFolders(new Set());
    setLoadingFiles(true);
    setSubordinateWorkers([]);
    setShowSubordinateWorkers(false);

    // Fetch store files
    fetch(`${API_URL}/admin/store/${selectedUserId}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch store files');
        return res.json();
      })
      .then((files: FileItem[]) => {
        setStoreFiles(files);
        setLoadingFiles(false);
      })
      .catch(err => {
        console.error('Error fetching files:', err);
        setLoadingFiles(false);
      });

    // Fetch tenant tables - INCLUDING SUBORDINATE WORKERS
    const tables = ["customers", "orders", "products", "stocks", "invoices", "paymentlogs", "subordinateworkers"];
    tables.forEach(table => {
      fetch(`${API_URL}/admin/tenant/${selectedUserId}/${table}`, { credentials: "include" })
        .then(res => res.ok ? res.json() : Promise.reject(`Failed ${table}`))
        .then((rows: any[]) => {
          setTenantData(prev => ({ ...prev, [table]: rows }));
          if (rows.length > 0) {
            setTenantColumns(prev => ({ ...prev, [table]: Object.keys(rows[0]) }));
          } else {
            // If no rows, get columns from schema
            fetch(`${API_URL}/admin/tenant/${selectedUserId}/${table}/columns`, { credentials: "include" })
              .then(res => res.json())
              .then((cols: string[]) => setTenantColumns(prev => ({ ...prev, [table]: cols })))
              .catch(console.error);
          }
        })
        .catch(err => {
          console.error(`Error fetching table ${table}:`, err);
          setTenantData(prev => ({ ...prev, [table]: [] }));
        });
    });
  }, [selectedUserId, API_URL]);

  // Fetch subordinate workers for selected user
  const fetchSubordinateWorkers = async () => {
    if (!selectedUserId) return;
    
    setLoadingSubordinates(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUserId}/subordinate-workers`, {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error('Failed to fetch subordinate workers');
      
      const workers = await response.json();
      setSubordinateWorkers(workers);
      setShowSubordinateWorkers(true);
    } catch (error) {
      console.error('Error fetching subordinate workers:', error);
      alert('Failed to load subordinate workers');
    } finally {
      setLoadingSubordinates(false);
    }
  };

  // Toggle folder expansion
  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  // Action modal functions
  const openActionModal = (type: 'suspend' | 'unsuspend' | 'delete', userId: number, userName: string) => {
    setSelectedAction({ type, userId, userName });
    setActionPassword("");
    setActionError(null);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedAction(null);
    setActionPassword("");
    setActionError(null);
  };

  const performUserAction = async () => {
    if (!selectedAction || !actionPassword.trim()) return;

    setPerformingAction(true);
    setActionError(null);
    
    try {
      let url = '';
      let method = 'POST';

      if (selectedAction.type === 'delete') {
        url = `${API_URL}/admin/users/${selectedAction.userId}`;
        method = 'DELETE';
      } else if (selectedAction.type === 'suspend') {
        url = `${API_URL}/admin/users/${selectedAction.userId}/suspend`;
      } else if (selectedAction.type === 'unsuspend') {
        url = `${API_URL}/admin/users/${selectedAction.userId}/unsuspend`;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({ password: actionPassword }),
      });

      if (!response.ok) {
        let errorMessage = 'Action failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`;
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || `HTTP error! status: ${response.status}`;
          } catch (textError) {
            errorMessage = `HTTP error! status: ${response.status}`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      alert(result.message || `${selectedAction.type} action completed successfully`);
      
      // Refresh users list
      const usersResponse = await fetch(`${API_URL}/users`, { credentials: "include" });
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        setAllUsers(users);
        setFilteredUsers(users);
      }

      closeActionModal();
    } catch (error) {
      console.error('User action error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      setActionError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setPerformingAction(false);
    }
  };

  // Export everything as ZIP
  const exportEverything = async () => {
    if (!selectedUserId) return;

    setExporting(true);
    try {
      const response = await fetch(`${API_URL}/admin/export/${selectedUserId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-${selectedUserId}-export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Download individual file
  const downloadFile = async (filePath: string) => {
    if (!selectedUserId) return;

    setDownloadingFile(filePath);
    try {
      const response = await fetch(
        `${API_URL}/admin/store/${selectedUserId}/download?file=${encodeURIComponent(filePath)}`, 
        { credentials: "include" }
      );

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || filePath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  // Preview file content
  const previewFileContent = async (filePath: string) => {
    if (!selectedUserId) return;

    try {
      const response = await fetch(
        `${API_URL}/admin/store/${selectedUserId}/preview?file=${encodeURIComponent(filePath)}`, 
        { credentials: "include" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Preview failed');
      }

      const fileData = await response.json();
      
      setPreviewFile({
        name: fileData.name,
        content: fileData.content,
        type: fileData.type
      });

    } catch (error) {
      console.error('Preview error:', error);
      alert(error instanceof Error ? error.message : 'Failed to preview file');
    }
  };

  // Close preview modal
  const closePreview = () => {
    setPreviewFile(null);
  };

  // Refresh file list
  const refreshFiles = () => {
    if (!selectedUserId) return;
    
    setLoadingFiles(true);
    fetch(`${API_URL}/admin/store/${selectedUserId}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch store files');
        return res.json();
      })
      .then((files: FileItem[]) => {
        setStoreFiles(files);
        setLoadingFiles(false);
      })
      .catch(err => {
        console.error('Error refreshing files:', err);
        setLoadingFiles(false);
      });
  };

  // Helper to render files and folders recursively with expandable folders
  const renderFileStructure = (files: FileItem[], depth = 0) => {
    return files.map((item, index) => (
      <div key={`${item.path}-${index}`}>
        <div 
          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
            depth > 0 ? 'ml-6' : ''
          } ${item.isDirectory ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center space-x-3 flex-1">
            {item.isDirectory && (
              <button
                onClick={() => toggleFolder(item.path)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {expandedFolders.has(item.path) ? '▼' : '►'}
              </button>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              item.isDirectory ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <span className={`text-sm ${
                item.isDirectory ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {item.isDirectory ? '📁' : '📄'}
              </span>
            </div>
            <div className="flex-1">
              <span className={`font-mono text-sm ${
                item.isDirectory ? 'text-blue-800 font-medium' : 'text-gray-800'
              }`}>
                {item.name}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {item.isDirectory ? (
                  `📂 FOLDER • ${item.children.length} items`
                ) : (
                  `${item.name.split('.').pop()?.toUpperCase() || 'FILE'} • ${formatFileSize(item.size)}`
                )}
              </div>
            </div>
          </div>
          
          {item.isFile && (
            <div className="flex space-x-2">
              <button
                onClick={() => previewFileContent(item.path)}
                className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Preview
              </button>
              <button
                onClick={() => downloadFile(item.path)}
                disabled={downloadingFile === item.path}
                className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400 transition-colors"
              >
                {downloadingFile === item.path ? 'Downloading...' : 'Download'}
              </button>
            </div>
          )}
        </div>
        
        {/* Render children recursively for expanded directories */}
        {item.isDirectory && expandedFolders.has(item.path) && item.children.length > 0 && (
          <div className="mt-2 border-l-2 border-blue-200 ml-4">
            {renderFileStructure(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Count total files recursively
  const countTotalFiles = (items: FileItem[]): number => {
    return items.reduce((count, item) => {
      if (item.isFile) {
        return count + 1;
      } else if (item.isDirectory) {
        return count + countTotalFiles(item.children);
      }
      return count;
    }, 0);
  };

  // Count total folders recursively
  const countTotalFolders = (items: FileItem[]): number => {
    return items.reduce((count, item) => {
      if (item.isDirectory) {
        return count + 1 + countTotalFolders(item.children);
      }
      return count;
    }, 0);
  };

  // Format JSON for display
  const formatJSON = (data: any): string => {
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const totalFiles = countTotalFiles(storeFiles);
  const totalFolders = countTotalFolders(storeFiles);

  return (
    <div className="p-8 bg-gray-100 min-h-screen space-y-8">
      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Preview: {previewFile.name}</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap p-6 text-sm overflow-auto h-full font-mono">
                {previewFile.content}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => downloadFile(previewFile.name)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
              >
                Download File
              </button>
              <button
                onClick={closePreview}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && selectedAction && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md flex flex-col shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedAction.type === 'suspend' && 'Suspend User'}
                {selectedAction.type === 'unsuspend' && 'Unsuspend User'}
                {selectedAction.type === 'delete' && 'Delete User'}
              </h3>
              <button
                onClick={closeActionModal}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                disabled={performingAction}
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-700 mb-4">
                {selectedAction.type === 'suspend' && `Are you sure you want to suspend ${selectedAction.userName}? They will not be able to access the system.`}
                {selectedAction.type === 'unsuspend' && `Are you sure you want to unsuspend ${selectedAction.userName}?`}
                {selectedAction.type === 'delete' && `WARNING: This will permanently delete ${selectedAction.userName} and all their data. This action cannot be undone.`}
              </p>
              <div className="mb-4">
                <label htmlFor="actionPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Security Password
                </label>
                <input
                  id="actionPassword"
                  type="password"
                  value={actionPassword}
                  onChange={(e) => setActionPassword(e.target.value)}
                  placeholder="Enter security password..."
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={performingAction}
                />
              </div>
              {actionError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{actionError}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={closeActionModal}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                disabled={performingAction}
              >
                Cancel
              </button>
              <button
                onClick={performUserAction}
                disabled={!actionPassword.trim() || performingAction}
                className={`px-4 py-2 rounded transition-colors ${
                  selectedAction.type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {performingAction ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  selectedAction.type === 'suspend' ? 'Suspend User' :
                  selectedAction.type === 'unsuspend' ? 'Unsuspend User' : 'Delete User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <img src="logo-withoutbackground.png" className="w-60 mb-[-80px] mt-[-100px]"/>
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {currentUser.name}!</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Users
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Users ({filteredUsers.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surname</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{u.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{u.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{u.surname}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{u.username}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{u.phone_number}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      u.admin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {u.admin ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      u.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {u.suspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 text-xs font-medium bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        View Data
                      </button>
                      {!u.admin && (
                        <>
                          {u.suspended ? (
                            <button
                              onClick={() => openActionModal('unsuspend', u.id, `${u.name} ${u.surname}`)}
                              className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              onClick={() => openActionModal('suspend', u.id, `${u.name} ${u.surname}`)}
                              className="px-3 py-1 text-xs font-medium bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => openActionModal('delete', u.id, `${u.name} ${u.surname}`)}
                            className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-gray-500">
                    No users found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected User Data Section */}
      {selectedUserId && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  User Data: {selectedUserId}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Store files and database tables for selected user
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={refreshFiles}
                  disabled={loadingFiles}
                  className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                >
                  {loadingFiles ? 'Refreshing...' : 'Refresh Files'}
                </button>
                <button
                  onClick={() => setShowTables(!showTables)}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showTables ? 'Hide Tables' : 'Show Tables'}
                </button>
                <button
                  onClick={fetchSubordinateWorkers}
                  disabled={loadingSubordinates}
                  className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  {loadingSubordinates ? 'Loading...' : 'View Subordinate Workers'}
                </button>
                <button
                  onClick={exportEverything}
                  disabled={exporting}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Exporting...
                    </>
                  ) : (
                    'Export All as ZIP'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Subordinate Workers Section */}
          {showSubordinateWorkers && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Subordinate Workers ({subordinateWorkers.length})
                  </h3>
                  <button
                    onClick={() => setShowSubordinateWorkers(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-6">
                {subordinateWorkers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Surname</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subordinateWorkers.map(worker => (
                          <tr key={worker.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{worker.id}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{worker.name}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{worker.surname}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{worker.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{worker.phone_number}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{worker.role}</td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {new Date(worker.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No subordinate workers found for this user
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Store Files */}
          {showTables && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Store Files
                  </h3>
                  <span className="text-sm text-gray-500">
                    {totalFiles} files • {totalFolders} folders
                  </span>
                </div>
              </div>
              <div className="p-6">
                {loadingFiles ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading files...</p>
                  </div>
                ) : storeFiles.length > 0 ? (
                  <div className="space-y-2">
                    {renderFileStructure(storeFiles)}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No files found in user's store folder
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tenant Tables */}
          {showTables && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Database Tables</h3>
              </div>
              <div className="p-6 space-y-8">
                {Object.keys(tenantData).map(tableName => (
                  <div key={tableName} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-semibold text-gray-800 capitalize">
                        {tableName === "subordinateworkers" ? "Subordinate Workers" : tableName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {tenantData[tableName]?.length || 0} rows, {tenantColumns[tableName]?.length || 0} columns
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            {tenantColumns[tableName]?.map(col => (
                              <th key={col} className="py-2 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {tenantData[tableName]?.length > 0 ? tenantData[tableName].map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              {tenantColumns[tableName]?.map((col, i) => (
                                <td key={i} className="py-2 px-4 text-sm text-gray-900 max-w-xs">
                                  {row[col] !== null && row[col] !== undefined ? (
                                    typeof row[col] === 'object' ? (
                                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                        {formatJSON(row[col])}
                                      </pre>
                                    ) : (
                                      String(row[col])
                                    )
                                  ) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={tenantColumns[tableName]?.length || 1} className="py-4 px-4 text-center text-gray-500">
                                No data found in this table
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}