"use client";

import React, { useEffect, useState } from "react";
import { 
  authApi, 
  adminAPI, 
  filesAPI, 
  fileUtils,
  type User,
  type FileItem,
  type FileContent,
  type SubordinateWorker, 
  adminCrudAPI
} from "../../lib/api";
import CrudModal from "./crud/crud";
import './styles/styles.css';

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
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
// Table configurations for all tables with complete required fields
const tableConfigs: Record<string, { fields: TableField[] }> = {
  customers: {
    fields: [
      { name: 'name', type: 'text', label: 'First Name', required: true, placeholder: 'Enter first name' },
      { name: 'surname', type: 'text', label: 'Last Name', required: true, placeholder: 'Enter last name' },
      { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Enter email address' },
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
      { name: 'description', type: 'textarea', label: 'Description', placeholder: 'Enter product description' },
      { name: 'data', type: 'textarea', label: 'Additional Data (JSON)', placeholder: 'Enter additional data as JSON' }
    ]
  },
  orders: {
    fields: [
      { name: 'product_id', type: 'number', label: 'Product ID', required: true, placeholder: 'Enter product ID' },
      { name: 'quantity', type: 'number', label: 'Quantity', required: true, placeholder: 'Enter quantity' },
      { name: 'total', type: 'number', label: 'Total Amount', required: true, placeholder: 'Enter total amount' },
      { name: 'status', type: 'select', label: 'Status', required: true, 
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'processing', label: 'Processing' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      { name: 'TVA', type: 'number', label: 'TVA', placeholder: 'Enter TVA' },
      { name: 'data_invoices', type: 'textarea', label: 'Invoice Data (JSON)', placeholder: 'Enter invoice data as JSON' }
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
      { name: 'total_amount', type: 'number', label: 'Total Amount', required: true, placeholder: 'Enter total amount' },
      { name: 'status', type: 'select', label: 'Status', required: true,
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      { name: 'customer_id', type: 'number', label: 'Customer ID', placeholder: 'Enter customer ID' },
      { name: 'issue_date', type: 'date', label: 'Issue Date', placeholder: 'Select issue date' },
      { name: 'due_date', type: 'date', label: 'Due Date', placeholder: 'Select due date' }
    ]
  },
  paymentlogs: {
    fields: [
      { name: 'invoice_id', type: 'number', label: 'Invoice ID', required: true, placeholder: 'Enter invoice ID' },
      { name: 'amount', type: 'number', label: 'Amount', required: true, placeholder: 'Enter payment amount' },
      { name: 'status', type: 'select', label: 'Status', required: true,
        options: [
          { value: 'completed', label: 'Completed' },
          { value: 'failed', label: 'Failed' },
          { value: 'pending', label: 'Pending' },
          { value: 'refunded', label: 'Refunded' }
        ]
      },
      { name: 'payment_method', type: 'select', label: 'Payment Method', required: true,
        options: [
          { value: 'credit_card', label: 'Credit Card' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'cash', label: 'Cash' },
          { value: 'paypal', label: 'PayPal' }
        ]
      },
      { name: 'transaction_id', type: 'text', label: 'Transaction ID', placeholder: 'Enter transaction ID' }
    ]
  },
  subordinateworkers: {
    fields: [
      { name: 'name', type: 'text', label: 'First Name', required: true, placeholder: 'Enter first name' },
      { name: 'surname', type: 'text', label: 'Last Name', required: true, placeholder: 'Enter last name' },
      { name: 'email', type: 'email', label: 'Email', required: true, placeholder: 'Enter email address' },
      { name: 'phone_number', type: 'text', label: 'Phone Number', required: true, placeholder: 'Enter phone number' },
      { name: 'role', type: 'text', label: 'Role', required: true, placeholder: 'Enter role' },
      { name: 'password', type: 'password', label: 'Password', required: true, placeholder: 'Enter password' },
      { name: 'permissions', type: 'textarea', label: 'Permissions (JSON)', placeholder: 'Enter permissions as JSON' },
      { name: 'logs', type: 'textarea', label: 'Logs (JSON)', placeholder: 'Enter logs as JSON' }
    ]
  }
};

  // Menu sections
  const menuSections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users Management', icon: '👥' },
    { id: 'files', label: 'File Explorer', icon: '📁' },
    { id: 'database', label: 'Database Tables', icon: '🗃️' },
  ];

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

const handleSave = async (data: any) => {
  setCrudLoading(true);
  try {
    const isEditing = editingData && editingData.id;
    
    // Process the data before sending - handle JSON fields
    const processedData = { ...data };
    
    // Process JSON fields
    const jsonFields = ['data', 'data_invoices', 'permissions', 'logs'];
    jsonFields.forEach(field => {
      if (processedData[field] && typeof processedData[field] === 'string') {
        try {
          processedData[field] = JSON.parse(processedData[field]);
        } catch (error) {
          console.warn(`Failed to parse ${field} as JSON, keeping as string`);
        }
      }
    });

    // Handle numeric fields
    const numericFields = ['product_id', 'quantity', 'price', 'total', 'TVA', 'total_amount', 'amount', 'minimum_stock', 'reduced_percentage'];
    numericFields.forEach(field => {
      if (processedData[field] !== undefined && processedData[field] !== null) {
        processedData[field] = Number(processedData[field]);
      }
    });

    console.log('🔄 Admin CRUD Operation Started:', {
      table: selectedTable,
      targetUserId: selectedUserId,
      isEditing,
      editingData,
      processedData
    });

    let result: any;

    if (isEditing) {
      result = await adminCrudAPI.update(selectedUserId!, selectedTable, editingData.id, processedData);
    } else {
      result = await adminCrudAPI.create(selectedUserId!, selectedTable, processedData);
    }

    console.log('✅ Operation result:', result);

    // Refresh the tenant data
    if (selectedUserId) {
      const refreshedData = await adminAPI.getTenantTable(selectedUserId, selectedTable);
      setTenantData(prev => ({ ...prev, [selectedTable]: refreshedData }));
    }

    alert(result.message || `${selectedTable} ${isEditing ? 'updated' : 'created'} successfully!`);
    
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('❌ Operation Failed:', errorMessage);
    alert('Failed to save data: ' + errorMessage);
  } finally {
    setCrudLoading(false);
  }
};

  const handleDelete = async (id: number) => {
    setCrudLoading(true);
    try {
      await adminCrudAPI.delete(selectedUserId!, selectedTable, id);

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
          className={`flex items-center justify-between p-3 border rounded-lg hover:bg-base-200 transition-colors ${
            depth > 0 ? 'ml-6' : ''
          } ${item.isDirectory ? 'bg-primary/10 border-primary/20' : 'bg-base-100 border-base-300'}`}
        >
          <div className="flex items-center space-x-3 flex-1">
            {item.isDirectory && (
              <button
                onClick={() => toggleFolder(item.path)}
                className="text-base-content/70 hover:text-base-content transition-colors"
              >
                {expandedFolders.has(item.path) ? '▼' : '►'}
              </button>
            )}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              item.isDirectory ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content'
            }`}>
              <span className="text-sm">
                {fileUtils.getFileIcon(item.name, item.isDirectory)}
              </span>
            </div>
            <div className="flex-1">
              <span className={`font-mono text-sm ${
                item.isDirectory ? 'text-primary font-medium' : 'text-base-content'
              }`}>
                {item.name}
              </span>
              <div className="text-xs text-base-content/70 mt-1">
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
                  className="btn btn-primary btn-sm"
                >
                  View Image
                </button>
              ) : (
                // Show Preview button for non-image files
                <button
                  onClick={() => previewFileContent(item.path)}
                  className="btn btn-secondary btn-sm"
                >
                  Preview
                </button>
              )}
              <button
                onClick={() => downloadFile(item.path)}
                disabled={downloadingFile === item.path}
                className="btn btn-accent btn-sm"
              >
                {downloadingFile === item.path ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  'Download'
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Render children recursively for expanded directories */}
        {item.isDirectory && expandedFolders.has(item.path) && item.children.length > 0 && (
          <div className="mt-2 border-l-2 border-primary/30 ml-4">
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
        className="btn btn-primary btn-xs"
      >
        Edit
      </button>
      <button
        onClick={() => {
          if (window.confirm(`Are you sure you want to delete this ${tableName}?`)) {
            handleDelete(row.id);
          }
        }}
        className="btn btn-error btn-xs"
      >
        Delete
      </button>
    </div>
  );

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Render current section content
  const renderSectionContent = () => {
    const totalFiles = countTotalFiles(storeFiles);
    const totalFolders = countTotalFolders(storeFiles);

    switch (currentSection) {
      case 'dashboard':
        return (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              <div className="text-sm text-base-content/70">
                Welcome back, {currentUser?.name}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-primary">Total Users</h2>
                  <p className="text-3xl font-bold">{allUsers.length}</p>
                </div>
              </div>
              
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-success">Active Users</h2>
                  <p className="text-3xl font-bold">{allUsers.filter(u => !u.suspended).length}</p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-warning">Suspended</h2>
                  <p className="text-3xl font-bold">{allUsers.filter(u => u.suspended).length}</p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-info">Admin Users</h2>
                  <p className="text-3xl font-bold">{allUsers.filter(u => u.admin).length}</p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setCurrentSection('users')}
                    className="btn btn-primary"
                  >
                    Manage Users
                  </button>
                  <button 
                    onClick={() => setCurrentSection('files')}
                    className="btn btn-secondary"
                  >
                    File Explorer
                  </button>
                  <button 
                    onClick={() => setCurrentSection('database')}
                    className="btn btn-accent"
                  >
                    Database Tables
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Users Management</h1>
              <div className="badge badge-lg badge-primary">
                {filteredUsers.length} users
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="max-w-md">
                  <label className="label">
                    <span className="label-text font-semibold">Search Users</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, email, phone..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Surname</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Admin</th>
                        <th>Status</th>
                        <th>Subscription</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <tr key={u.id} className="hover">
                          <td className="font-mono">{u.id}</td>
                          <td className="font-semibold">{u.name}</td>
                          <td>{u.surname}</td>
                          <td>{u.username}</td>
                          <td>{u.email}</td>
                          <td>{u.phone_number}</td>
                          <td>
                            <div className={`badge ${u.admin ? 'badge-success' : 'badge-ghost'}`}>
                              {u.admin ? "Yes" : "No"}
                            </div>
                          </td>
                          <td>
                            <div className={`badge ${u.suspended ? 'badge-error' : 'badge-success'}`}>
                              {u.suspended ? "Suspended" : "Active"}
                            </div>
                          </td>
                          <td>
                            <div className={`badge ${u.active_subscription ? 'badge-success' : 'badge-error'}`}>
                              {u.active_subscription ? "Active" : "Inactive"}
                            </div>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setSelectedUserId(u.id)}
                              >
                                View Data
                              </button>
                              {!u.admin && (
                                <>
                                  {u.suspended ? (
                                    <button
                                      onClick={() => openActionModal('unsuspend', u.id, `${u.name} ${u.surname}`)}
                                      className="btn btn-success btn-sm"
                                    >
                                      Unsuspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => openActionModal('suspend', u.id, `${u.name} ${u.surname}`)}
                                      className="btn btn-warning btn-sm"
                                    >
                                      Suspend
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openActionModal('delete', u.id, `${u.name} ${u.surname}`)}
                                    className="btn btn-error btn-sm"
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
                          <td colSpan={10} className="text-center py-8 text-base-content/70">
                            No users found matching your search
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Selected User Data Section */}
            {selectedUserId && (
              <div className="space-y-6">
                {/* Controls */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                      <div>
                        <h2 className="card-title text-2xl">
                          User Data: {selectedUserId}
                        </h2>
                        <p className="text-base-content/70 text-sm mt-1">
                          Store files and database tables for selected user
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={refreshFiles}
                          disabled={loadingFiles}
                          className="btn btn-ghost"
                        >
                          {loadingFiles ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            'Refresh Files'
                          )}
                        </button>
                        <button
                          onClick={() => setShowTables(!showTables)}
                          className="btn btn-secondary"
                        >
                          {showTables ? 'Hide Tables' : 'Show Tables'}
                        </button>
                        <button
                          onClick={fetchSubordinateWorkers}
                          disabled={loadingSubordinates}
                          className="btn btn-accent"
                        >
                          {loadingSubordinates ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            'View Subordinate Workers'
                          )}
                        </button>
                        <button
                          onClick={exportEverything}
                          disabled={exporting}
                          className="btn btn-primary"
                        >
                          {exporting ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : (
                            'Export All as ZIP'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subordinate Workers Section */}
                {showSubordinateWorkers && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="card-title text-xl">
                          Subordinate Workers ({subordinateWorkers.length})
                        </h3>
                        <button
                          onClick={() => setShowSubordinateWorkers(false)}
                          className="btn btn-ghost btn-circle"
                        >
                          ✕
                        </button>
                      </div>
                      {subordinateWorkers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="table table-zebra">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subordinateWorkers.map(worker => (
                                <tr key={worker.id} className="hover">
                                  <td className="py-3 px-4 text-sm">{worker.id}</td>
                                  <td className="py-3 px-4 text-sm font-semibold">{worker.name}</td>
                                  <td className="py-3 px-4 text-sm">{worker.surname}</td>
                                  <td className="py-3 px-4 text-sm">{worker.email}</td>
                                  <td className="py-3 px-4 text-sm">{worker.phone_number}</td>
                                  <td className="py-3 px-4 text-sm">{worker.role}</td>
                                  <td className="py-3 px-4 text-sm">
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
                        <div className="text-center py-8 text-base-content/70">
                          No subordinate workers found for this user
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Store Files */}
                {showTables && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="card-title text-xl">Store Files</h3>
                        <span className="text-sm text-base-content/70">
                          {totalFiles} files • {totalFolders} folders
                        </span>
                      </div>
                      {loadingFiles ? (
                        <div className="text-center py-8">
                          <span className="loading loading-spinner loading-lg text-primary"></span>
                          <p className="text-base-content/70 mt-2">Loading files...</p>
                        </div>
                      ) : storeFiles.length > 0 ? (
                        <div className="space-y-2">
                          {renderFileStructure(storeFiles)}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-base-content/70">
                          No files found in user's store folder
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tenant Tables */}
                {showTables && (
                  <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                      <h3 className="card-title text-xl mb-4">Database Tables</h3>
                      <div className="space-y-8">
                        {Object.keys(tenantData).map(tableName => (
                          <div key={tableName} className="border rounded-lg overflow-hidden">
                            <div className="bg-base-200 px-4 py-3 border-b">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-semibold capitalize">
                                    {tableName === "subordinateworkers" ? "Subordinate Workers" : tableName}
                                  </h4>
                                  <p className="text-sm text-base-content/70">
                                    {tenantData[tableName]?.length || 0} rows, {tenantColumns[tableName]?.length || 0} columns
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddNew(tableName)}
                                  className="btn btn-success btn-sm"
                                >
                                  Add New
                                </button>
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="table table-zebra">
                                <thead>
                                  <tr>
                                    {tenantColumns[tableName]?.map(col => (
                                      <th key={col} className="text-xs font-medium uppercase">
                                        {col}
                                      </th>
                                    ))}
                                    <th className="text-xs font-medium uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {tenantData[tableName]?.length > 0 ? tenantData[tableName].map((row, idx) => (
                                    <tr key={idx} className="hover">
                                      {tenantColumns[tableName]?.map((col, i) => (
                                        <td key={i} className="text-sm max-w-xs">
                                          {row[col] !== null && row[col] !== undefined ? (
                                            typeof row[col] === 'object' ? (
                                              <pre className="text-xs whitespace-pre-wrap">
                                                {formatJSON(row[col])}
                                              </pre>
                                            ) : (
                                              String(row[col])
                                            )
                                          ) : 'NULL'}
                                        </td>
                                      ))}
                                      <td className="text-sm">
                                        {renderTableActions(tableName, row)}
                                      </td>
                                    </tr>
                                  )) : (
                                    <tr>
                                      <td colSpan={(tenantColumns[tableName]?.length || 0) + 1} className="text-center py-4 text-base-content/70">
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
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'files':
        return (
          <div className="p-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl">File Explorer</h2>
                <p>Select a user from the Users section to view their files.</p>
              </div>
            </div>
          </div>
        );

      case 'database':
        return (
          <div className="p-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl">Database Tables</h2>
                <p>Select a user from the Users section to view their database tables.</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Section Not Found</h2>
                <p>Please select a valid section from the sidebar.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-base-content/70 text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-base-200 border-r border-base-300 flex flex-col">
        {/* Logo & Header */}
        <div className="p-6 border-b border-base-300">
          <div className="flex items-center space-x-3">
            <img 
              src="logo-withoutbackground.png" 
              className="w-10 h-10" 
              alt="Admin Logo" 
            />
            <div>
              <h1 className="text-xl font-bold text-base-content">KapryGest</h1>
              <p className="text-sm text-base-content/70">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center space-x-3">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10">
                <span className="text-sm">
                  {currentUser?.name?.charAt(0) || 'A'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-base-content truncate">
                {currentUser?.name || 'Admin'}
              </p>
              <p className="text-xs text-base-content/70 truncate">
                {currentUser?.email || 'admin@kaprygest.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuSections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                    currentSection === section.id
                      ? 'bg-primary text-primary-content shadow-lg'
                      : 'text-base-content hover:bg-base-300 hover:text-base-content'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-4 border-t border-base-300 space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 bg-base-300 rounded-lg">
            <span className="text-sm text-base-content">Theme</span>
            <label className="swap swap-rotate">
              <input 
                type="checkbox" 
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              {/* Sun icon for light mode */}
              <div className="swap-on">🌙</div>
              {/* Moon icon for dark mode */}
              <div className="swap-off">☀️</div>
            </label>
          </div>

          {/* Logout Button */}
          <button 
            onClick={() => window.location.href = '/logout'}
            className="w-full btn btn-outline btn-error btn-sm"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-base-100">
        {/* Modals */}
        {showActionModal && selectedAction && (
          <div className="modal modal-open">
            <div className="modal-box">
              <div className="flex justify-between items-center pb-4 border-b border-base-300">
                <h3 className="text-lg font-semibold">
                  {selectedAction.type === 'suspend' && 'Suspend User'}
                  {selectedAction.type === 'unsuspend' && 'Unsuspend User'}
                  {selectedAction.type === 'delete' && 'Delete User'}
                </h3>
                <button
                  onClick={closeActionModal}
                  className="btn btn-ghost btn-circle"
                  disabled={performingAction}
                >
                  ✕
                </button>
              </div>
              <div className="py-4">
                <p className="mb-4">
                  {selectedAction.type === 'suspend' && `Are you sure you want to suspend ${selectedAction.userName}? They will not be able to access the system.`}
                  {selectedAction.type === 'unsuspend' && `Are you sure you want to unsuspend ${selectedAction.userName}?`}
                  {selectedAction.type === 'delete' && `WARNING: This will permanently delete ${selectedAction.userName} and all their data. This action cannot be undone.`}
                </p>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold">Security Password</span>
                  </label>
                  <input
                    type="password"
                    value={actionPassword}
                    onChange={(e) => setActionPassword(e.target.value)}
                    placeholder="Enter security password..."
                    className="input input-bordered w-full"
                    disabled={performingAction}
                  />
                </div>
                {actionError && (
                  <div className="alert alert-error mb-4">
                    <span>{actionError}</span>
                  </div>
                )}
              </div>
              <div className="modal-action">
                <button
                  onClick={closeActionModal}
                  className="btn btn-ghost"
                  disabled={performingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={performUserAction}
                  disabled={!actionPassword.trim() || performingAction}
                  className={`btn ${
                    selectedAction.type === 'delete' 
                      ? 'btn-error' 
                      : selectedAction.type === 'suspend'
                      ? 'btn-warning'
                      : 'btn-success'
                  }`}
                >
                  {performingAction ? (
                    <span className="flex items-center">
                      <span className="loading loading-spinner loading-sm mr-2"></span>
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

        {previewFile && (
          <div className="modal modal-open">
            <div className="modal-box max-w-6xl h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-4 border-b border-base-300">
                <h3 className="text-lg font-semibold">
                  Preview: {previewFile.name}
                  {previewFile.type === 'image' && previewFile.size && (
                    <span className="text-sm opacity-70 ml-2">
                      ({fileUtils.formatFileSize(previewFile.size)})
                    </span>
                  )}
                </h3>
                <button
                  onClick={closePreview}
                  className="btn btn-ghost btn-circle"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-auto py-4">
                {previewFile.type === 'image' ? (
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
                                <div class="text-center text-error p-8">
                                  <div class="text-4xl mb-4">❌</div>
                                  <p>Failed to load image</p>
                                  <p class="text-sm opacity-70 mt-2">The image may be corrupted or in an unsupported format</p>
                                </div>
                              `;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center opacity-70 p-8">
                        <div className="text-4xl mb-4">🖼️</div>
                        <p>Image data not available</p>
                        <p className="text-sm mt-2">Try downloading the file instead</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap p-6 text-sm overflow-auto h-full font-mono bg-base-300 rounded-lg">
                    {previewFile.content}
                  </pre>
                )}
              </div>
              
              <div className="pt-4 border-t border-base-300 flex justify-end space-x-2">
                <button
                  onClick={() => downloadFile(previewFile.name)}
                  className="btn btn-primary"
                >
                  Download File
                </button>
                <button
                  onClick={closePreview}
                  className="btn btn-ghost"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Section Content */}
        {renderSectionContent()}
      </div>
    </div>
  );
}