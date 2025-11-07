"use client";

import React, { useEffect, useState } from "react";
import { 
  authApi, 
  adminAPI, 
  filesAPI, 
  fileUtils,
  universalCrudAPI,
  type User,
  type FileItem,
  type FileContent,
  type SubordinateWorker 
} from "../../lib/api";
import CrudModal from "./crud/crud";

interface TableField {
  name: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'password';
  label: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

// Safe error handler function
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

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

  // CRUD states
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [editingData, setEditingData] = useState<any>(null);
  const [crudLoading, setCrudLoading] = useState(false);

  // Table configurations for all tables
  const tableConfigs: Record<string, { fields: TableField[] }> = {
    customers: {
      fields: [
        { name: 'name', type: 'text', label: 'First Name', required: true, placeholder: 'Enter first name' },
        { name: 'surname', type: 'text', label: 'Last Name', required: true, placeholder: 'Enter last name' },
        { name: 'email', type: 'email', label: 'Email', placeholder: 'Enter email address' },
        { name: 'phone_number', type: 'text', label: 'Phone Number', placeholder: 'Enter phone number' },
        { name: 'billing_address', type: 'textarea', label: 'Billing Address', placeholder: 'Enter billing address' }
      ]
    },
    products: {
      fields: [
        { name: 'name', type: 'text', label: 'Product Name', required: true, placeholder: 'Enter product name' },
        { name: 'category', type: 'text', label: 'Category', required: true, placeholder: 'Enter category' },
        { name: 'price', type: 'number', label: 'Price', required: true, placeholder: '0.00' },
        { name: 'reduced_percentage', type: 'number', label: 'Discount %', placeholder: '0' },
        { name: 'description', type: 'textarea', label: 'Description', placeholder: 'Enter product description' }
      ]
    },
    orders: {
      fields: [
        { name: 'product_id', type: 'number', label: 'Product ID', required: true, placeholder: 'Enter product ID' },
        { name: 'quantity', type: 'number', label: 'Quantity', required: true, placeholder: 'Enter quantity' },
        { name: 'TVA', type: 'number', label: 'TVA', placeholder: 'Enter TVA' },
        { name: 'total', type: 'number', label: 'Total', required: true, placeholder: 'Enter total amount' },
        { name: 'status', type: 'select', label: 'Status', required: true, 
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' }
          ]
        }
      ]
    },
    stocks: {
      fields: [
        { name: 'product_id', type: 'number', label: 'Product ID', required: true, placeholder: 'Enter product ID' },
        { name: 'quantity', type: 'number', label: 'Quantity', required: true, placeholder: 'Enter quantity' },
        { name: 'location', type: 'text', label: 'Location', placeholder: 'Enter storage location' },
        { name: 'minimum_stock', type: 'number', label: 'Minimum Stock', placeholder: 'Enter minimum stock level' }
      ]
    },
    invoices: {
      fields: [
        { name: 'order_id', type: 'number', label: 'Order ID', required: true, placeholder: 'Enter order ID' },
        { name: 'customer_id', type: 'number', label: 'Customer ID', placeholder: 'Enter customer ID' },
        { name: 'total_amount', type: 'number', label: 'Total Amount', required: true, placeholder: 'Enter total amount' },
        { name: 'issue_date', type: 'date', label: 'Issue Date', placeholder: 'Select issue date' },
        { name: 'due_date', type: 'date', label: 'Due Date', placeholder: 'Select due date' },
        { name: 'status', type: 'select', label: 'Status', required: true,
          options: [
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'cancelled', label: 'Cancelled' }
          ]
        }
      ]
    },
    paymentlogs: {
      fields: [
        { name: 'invoice_id', type: 'number', label: 'Invoice ID', required: true, placeholder: 'Enter invoice ID' },
        { name: 'amount', type: 'number', label: 'Amount', required: true, placeholder: 'Enter payment amount' },
        { name: 'payment_method', type: 'select', label: 'Payment Method', required: true,
          options: [
            { value: 'credit_card', label: 'Credit Card' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cash', label: 'Cash' },
            { value: 'paypal', label: 'PayPal' }
          ]
        },
        { name: 'transaction_id', type: 'text', label: 'Transaction ID', placeholder: 'Enter transaction ID' },
        { name: 'status', type: 'select', label: 'Status', required: true,
          options: [
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'pending', label: 'Pending' },
            { value: 'refunded', label: 'Refunded' }
          ]
        }
      ]
    },
    subordinateworkers: {
      fields: [
        { name: 'name', type: 'text', label: 'First Name', required: true, placeholder: 'Enter first name' },
        { name: 'surname', type: 'text', label: 'Last Name', required: true, placeholder: 'Enter last name' },
        { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Enter email address' },
        { name: 'phone_number', type: 'text', label: 'Phone Number', required: true, placeholder: 'Enter phone number' },
        { name: 'role', type: 'text', label: 'Role', required: true, placeholder: 'Enter role' },
        { name: 'password', type: 'password', label: 'Password', required: true, placeholder: 'Enter password' }
      ]
    }
  };

  // Fetch current admin user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (!user.admin) {
          window.location.href = "/main-page";
        } else {
          setCurrentUser(user);
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Failed to fetch current user:', errorMessage);
        window.location.href = "/login";
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!currentUser) return;
      
      try {
        const users = await adminAPI.getAllUsers();
        setAllUsers(users);
        setFilteredUsers(users);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Failed to fetch users:', errorMessage);
      }
    };

    fetchAllUsers();
  }, [currentUser]);

  // Filter users
  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = allUsers.filter(u =>
      u.id.toString().includes(lower) ||
      u.name.toLowerCase().includes(lower) ||
      u.surname.toLowerCase().includes(lower) ||
      u.username.toLowerCase().includes(lower) ||
      u.email.toLowerCase().includes(lower) ||
      u.phone_number.toLowerCase().includes(lower) ||
      (u.active_subscription ? 'active' : 'inactive').includes(lower)
    );
    setFilteredUsers(filtered);
  }, [search, allUsers]);

  // Fetch store files and tenant tables when user is selected
  useEffect(() => {
    const fetchUserData = async () => {
      if (!selectedUserId) return;

      setStoreFiles([]);
      setTenantData({});
      setTenantColumns({});
      setExpandedFolders(new Set());
      setLoadingFiles(true);
      setSubordinateWorkers([]);
      setShowSubordinateWorkers(false);

      try {
        // Fetch store files
        const files = await filesAPI.getStoreFiles(selectedUserId);
        setStoreFiles(files);
        setLoadingFiles(false);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Error fetching files:', errorMessage);
        setLoadingFiles(false);
      }

      // Fetch tenant tables
      const tables = ["customers", "orders", "products", "stocks", "invoices", "paymentlogs", "subordinateworkers"];
      
      const fetchTableData = async (table: string) => {
        try {
          const rows = await adminAPI.getTenantTable(selectedUserId, table);
          setTenantData(prev => ({ ...prev, [table]: rows }));
          
          if (rows.length > 0) {
            setTenantColumns(prev => ({ ...prev, [table]: Object.keys(rows[0]) }));
          } else {
            try {
              const columns = await adminAPI.getTenantTableColumns(selectedUserId, table);
              setTenantColumns(prev => ({ ...prev, [table]: columns }));
            } catch (columnError) {
              const columnErrorMessage = getErrorMessage(columnError);
              console.error(`Error fetching columns for ${table}:`, columnErrorMessage);
            }
          }
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          console.error(`Error fetching table ${table}:`, errorMessage);
          setTenantData(prev => ({ ...prev, [table]: [] }));
        }
      };

      tables.forEach(table => fetchTableData(table));
    };

    fetchUserData();
  }, [selectedUserId]);

  // Fetch subordinate workers for selected user
  const fetchSubordinateWorkers = async () => {
    if (!selectedUserId) return;
    
    setLoadingSubordinates(true);
    try {
      const workers = await adminAPI.getSubordinateWorkers(selectedUserId);
      setSubordinateWorkers(workers);
      setShowSubordinateWorkers(true);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error fetching subordinate workers:', errorMessage);
      alert('Failed to load subordinate workers: ' + errorMessage);
    } finally {
      setLoadingSubordinates(false);
    }
  };

  // UNIVERSAL CRUD Handlers
  const handleAddNew = (tableName: string) => {
    setSelectedTable(tableName);
    setEditingData({});
    setCrudModalOpen(true);
  };

  const handleEdit = (tableName: string, row: any) => {
    setSelectedTable(tableName);
    setEditingData(row);
    setCrudModalOpen(true);
  };

  // Universal handleSave for ALL tables
  const handleSave = async (data: any) => {
    setCrudLoading(true);
    try {
      const isEditing = editingData && editingData.id;
      
      console.log('🔄 Universal CRUD Operation Started:', {
        table: selectedTable,
        isEditing,
        editingData,
        formData: data
      });

      let result: any;

      if (isEditing) {
        result = await universalCrudAPI.update(selectedTable, editingData.id, data);
        console.log('✅ Update result:', result);
      } else {
        result = await universalCrudAPI.create(selectedTable, data);
        console.log('✅ Create result:', result);
      }

      console.log('🔄 Refreshing tenant data...');
      // Refresh the tenant data
      if (selectedUserId) {
        const refreshedData = await adminAPI.getTenantTable(selectedUserId, selectedTable);
        console.log('✅ Refreshed data:', refreshedData);
        setTenantData(prev => ({ ...prev, [selectedTable]: refreshedData }));
      }

      alert(result.message || `${selectedTable} ${isEditing ? 'updated' : 'created'} successfully!`);
      console.log('✅ Universal CRUD Operation Completed Successfully');
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('❌ Universal CRUD Operation Failed:', errorMessage);
      alert('Failed to save data: ' + errorMessage);
    } finally {
      setCrudLoading(false);
    }
  };

  // Universal handleDelete for ALL tables
  const handleDelete = async (id: number) => {
    setCrudLoading(true);
    try {
      await universalCrudAPI.delete(selectedTable, id);

      // Refresh the tenant data
      if (selectedUserId) {
        const refreshedData = await adminAPI.getTenantTable(selectedUserId, selectedTable);
        setTenantData(prev => ({ ...prev, [selectedTable]: refreshedData }));
      }

      alert(`${selectedTable} deleted successfully!`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error deleting data:', errorMessage);
      alert('Failed to delete data: ' + errorMessage);
    } finally {
      setCrudLoading(false);
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
      let result: { message: string };
      
      switch (selectedAction.type) {
        case 'suspend':
          result = await adminAPI.suspendUser(selectedAction.userId, actionPassword);
          break;
        case 'unsuspend':
          result = await adminAPI.unsuspendUser(selectedAction.userId, actionPassword);
          break;
        case 'delete':
          result = await adminAPI.deleteUser(selectedAction.userId, actionPassword);
          break;
      }

      alert(result.message || `${selectedAction.type} action completed successfully`);
      
      // Refresh users list
      const users = await adminAPI.getAllUsers();
      setAllUsers(users);
      setFilteredUsers(users);

      closeActionModal();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('User action error:', errorMessage);
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
      const blob = await filesAPI.exportAll(selectedUserId);
      
      // Check if blob is valid
      if (!blob || blob.size === 0) {
        throw new Error('Received empty file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-${selectedUserId}-export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Export error:', errorMessage);
      
      // Check if it's a JSON error (API returning error message)
      if (errorMessage.includes('JSON')) {
        alert('Server error: Could not export files. Please try again.');
      } else {
        alert('Failed to export data: ' + errorMessage);
      }
    } finally {
      setExporting(false);
    }
  };

  // Download individual file
  const downloadFile = async (filePath: string) => {
    if (!selectedUserId) return;

    setDownloadingFile(filePath);
    try {
      const blob = await filesAPI.downloadFile(selectedUserId, filePath);
      
      // Check if blob is valid
      if (!blob || blob.size === 0) {
        throw new Error('Received empty file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || filePath;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Download error:', errorMessage);
      
      // Check if it's a JSON error (API returning error message)
      if (errorMessage.includes('JSON')) {
        alert('Server error: Could not download file. The file might not exist.');
      } else {
        alert('Failed to download file: ' + errorMessage);
      }
    } finally {
      setDownloadingFile(null);
    }
  };

  // Preview file content
  const previewFileContent = async (filePath: string) => {
    if (!selectedUserId) return;

    try {
      const fileData = await filesAPI.previewFile(selectedUserId, filePath);
      
      // Handle image files
      if (fileData.type === 'image') {
        setPreviewFile({
          name: fileData.name,
          content: '',
          type: 'image',
          mimeType: fileData.mimeType,
          data: fileData.data,
          size: fileData.size
        });
      } else {
        // Handle text files
        setPreviewFile({
          name: fileData.name,
          content: fileData.content,
          type: fileData.type || 'text'
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Preview error:', errorMessage);
      alert('Failed to preview file: ' + errorMessage);
    }
  };

  // Direct image preview in new tab
  const previewImageDirect = (filePath: string) => {
    if (!selectedUserId) return;
    
    const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/files/admin/store/${selectedUserId}/preview?file=${encodeURIComponent(filePath)}&direct=true`;
    window.open(imageUrl, '_blank');
  };

  // Close preview modal
  const closePreview = () => {
    setPreviewFile(null);
  };

  // Refresh file list
  const refreshFiles = async () => {
    if (!selectedUserId) return;
    
    setLoadingFiles(true);
    try {
      const files = await filesAPI.getStoreFiles(selectedUserId);
      setStoreFiles(files);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Error refreshing files:', errorMessage);
    } finally {
      setLoadingFiles(false);
    }
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
                {fileUtils.getFileIcon(item.name, item.isDirectory)}
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
                  `${fileUtils.getFileTypeText(item.name)} • ${fileUtils.formatFileSize(item.size)}`
                )}
              </div>
            </div>
          </div>
          
          {item.isFile && (
            <div className="flex space-x-2">
              {/* Show "View Image" for image files instead of Preview */}
              {['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].some(ext => 
                item.name.toLowerCase().endsWith(ext)
              ) ? (
                <button
                  onClick={() => previewImageDirect(item.path)}
                  className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  View Image
                </button>
              ) : (
                // Show Preview button for non-image files
                <button
                  onClick={() => previewFileContent(item.path)}
                  className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Preview
                </button>
              )}
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

  // Render table actions
  const renderTableActions = (tableName: string, row: any) => (
    <div className="flex space-x-2">
      <button
        onClick={() => handleEdit(tableName, row)}
        className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={() => {
          if (window.confirm(`Are you sure you want to delete this ${tableName}?`)) {
            handleDelete(row.id);
          }
        }}
        className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Delete
      </button>
    </div>
  );

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
              <h3 className="text-lg font-semibold text-gray-800">
                Preview: {previewFile.name}
                {previewFile.type === 'image' && previewFile.size && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({fileUtils.formatFileSize(previewFile.size)})
                  </span>
                )}
              </h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700 text-lg font-bold hover:bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {previewFile.type === 'image' ? (
                // Image preview
                <div className="flex items-center justify-center h-full">
                  {previewFile.data ? (
                    <div className="max-w-full max-h-full flex items-center justify-center">
                      <img 
                        src={previewFile.data} 
                        alt={previewFile.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Failed to load image');
                          const container = e.currentTarget.parentElement;
                          if (container) {
                            container.innerHTML = `
                              <div class="text-center text-red-600 p-8">
                                <div class="text-4xl mb-4">❌</div>
                                <p>Failed to load image</p>
                                <p class="text-sm text-gray-500 mt-2">The image may be corrupted or in an unsupported format</p>
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 p-8">
                      <div className="text-4xl mb-4">🖼️</div>
                      <p>Image data not available</p>
                      <p className="text-sm text-gray-500 mt-2">Try downloading the file instead</p>
                    </div>
                  )}
                </div>
              ) : (
                // Text preview
                <pre className="whitespace-pre-wrap p-6 text-sm overflow-auto h-full font-mono bg-gray-50 rounded-lg">
                  {previewFile.content}
                </pre>
              )}
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

      {/* CRUD Modal */}
      <CrudModal
        isOpen={crudModalOpen}
        onClose={() => setCrudModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        tableName={selectedTable}
        fields={tableConfigs[selectedTable]?.fields || []}
        initialData={editingData}
        loading={crudLoading}
        allowDelete={!!editingData?.id}
      />

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
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      u.active_subscription ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.active_subscription ? "Active" : "Inactive"}
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
                  <td colSpan={10} className="py-8 px-4 text-center text-gray-500">
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
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                            <td className="py-3 px-4 text-sm">
                              {renderTableActions('subordinateworkers', worker)}
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
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-gray-800 capitalize">
                            {tableName === "subordinateworkers" ? "Subordinate Workers" : tableName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {tenantData[tableName]?.length || 0} rows, {tenantColumns[tableName]?.length || 0} columns
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddNew(tableName)}
                          className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Add New
                        </button>
                      </div>
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
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
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
                              <td className="py-2 px-4 text-sm">
                                {renderTableActions(tableName, row)}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={(tenantColumns[tableName]?.length || 0) + 1} className="py-4 px-4 text-center text-gray-500">
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