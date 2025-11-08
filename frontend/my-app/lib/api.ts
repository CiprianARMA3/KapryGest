const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Stock {
  id: number;
  product_id: number;
  quantity: number;
  location?: string;
  minimum_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: number;
  order_id: number;
  customer_id?: number;
  total_amount: number;
  issue_date?: string;
  due_date?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentLog {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const universalCrudAPI = {
  // Generic CRUD operations
  getAll: (table: string) => 
    apiClient.get<any[]>(`/crud/${table}`),
  
  getById: (table: string, id: number) => 
    apiClient.get<any>(`/crud/${table}/${id}`),
  
  create: (table: string, data: any) => 
    apiClient.post<{ message: string; [key: string]: any }>(`/crud/${table}`, data),
  
  update: (table: string, id: number, data: any) => 
    apiClient.put<{ message: string; [key: string]: any }>(`/crud/${table}/${id}`, data),
  
  delete: (table: string, id: number) => 
    apiClient.delete<{ message: string }>(`/crud/${table}/${id}`),
  
  getStructure: (table: string) => 
    apiClient.get<string[]>(`/crud/${table}/structure/columns`),
  
  getFieldTypes: (table: string) => 
    apiClient.get<Record<string, string>>(`/crud/${table}/structure/fields`),
};

// Add these API methods
export const stocksAPI = {
  getAll: () => 
    apiClient.get<Stock[]>('/stocks'),
  
  getById: (id: number) => 
    apiClient.get<Stock>(`/stocks/${id}`),
  
  create: (data: Omit<Stock, 'id' | 'created_at' | 'updated_at'>) => 
    apiClient.post<{ message: string; stock: Stock }>('/stocks', data),
  
  update: (id: number, data: Partial<Stock>) => 
    apiClient.put<{ message: string; stock: Stock }>(`/stocks/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/stocks/${id}`),
};

export const invoicesAPI = {
  getAll: () => 
    apiClient.get<Invoice[]>('/invoices'),
  
  getById: (id: number) => 
    apiClient.get<Invoice>(`/invoices/${id}`),
  
  create: (data: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>) => 
    apiClient.post<{ message: string; invoice: Invoice }>('/invoices', data),
  
  update: (id: number, data: Partial<Invoice>) => 
    apiClient.put<{ message: string; invoice: Invoice }>(`/invoices/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/invoices/${id}`),
};

export const paymentLogsAPI = {
  getAll: () => 
    apiClient.get<PaymentLog[]>('/paymentlogs'),
  
  getById: (id: number) => 
    apiClient.get<PaymentLog>(`/paymentlogs/${id}`),
  
  create: (data: Omit<PaymentLog, 'id' | 'created_at'>) => 
    apiClient.post<{ message: string; paymentLog: PaymentLog }>('/paymentlogs', data),
  
  update: (id: number, data: Partial<PaymentLog>) => 
    apiClient.put<{ message: string; paymentLog: PaymentLog }>(`/paymentlogs/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/paymentlogs/${id}`),
};

// User Interfaces
export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  username: string;
  phone_number: string;
  admin: boolean;
  suspended: boolean;
  active_subscription?: string;
  birthdate?: string;
  created_at?: string;
  last_login?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  birthdate: string;
  name: string;
  surname: string;
  phone_number: string;
}

// Customer Interfaces
export interface Customer {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone_number?: string;
  billing_address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomerData {
  name: string;
  surname: string;
  email: string;
  phone_number?: string;
  billing_address?: string;
}

// Product Interfaces
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  reduced_percentage?: number;
  description?: string;
  data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductData {
  name: string;
  category: string;
  price: number;
  reduced_percentage?: number;
  description?: string;
  data?: any;
}

// Order Interfaces
export interface Order {
  id: number;
  product_id: number;
  quantity: number;
  TVA?: number;
  total: number;
  status: string;
  data_invoices?: any;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderData {
  product_id: number;
  quantity: number;
  TVA?: number;
  total: number;
  status?: string;
  data_invoices?: any;
}

// Payment Interfaces
export interface PaymentData {
  id: number;
  name: string;
  surname: string;
  purchase_date: Date;
  payment_type: string;
  billing_address: string;
  phone_number: string;
}

// Subscription Interfaces
export interface SubscriptionData {
  id: number;
  payment_date: Date;
  expiry_date: Date;
}

// Subordinate Worker Interfaces
export interface SubordinateWorker {
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

// File Interfaces
export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  children: FileItem[];
}

export interface FileContent {
  name: string;
  content: string;
  type: string;
  mimeType?: string;
  data?: string;
  size?: number;
}

// New File System Interfaces for viewfiles API
export interface FileSystemItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size: number;
  modified: Date;
  children?: FileSystemItem[];
}

export interface FileSystemContent {
  name: string;
  path: string;
  content: string;
  type: string;
  mimeType: string;
  size: number;
  encoding?: string;
}

export interface FolderStructure {
  path: string;
  basePath: string;
  items: FileSystemItem[];
  totalItems: number;
  totalDirectories: number;
  totalFiles: number;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include' as RequestCredentials,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log('🔄 API Call:', url, options.method || 'GET');

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.ok) {
          return {} as T;
        } else {
          const text = await response.text();
          throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.substring(0, 100)}`);
        }
      }
      
      const data: ApiResponse<T> = await response.json();
      
      if (!response.ok) {
        // Enhanced error handling
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

async delete<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: 'DELETE',
    };

    // Add body if data is provided
    if (data) {
      options.headers = {
        'Content-Type': 'application/json',
      };
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }
}

export const apiClient = new ApiClient();

// Auth API methods
export const authApi = {
  login: (data: LoginData) => 
    apiClient.post<{ message: string; token: string; user: User }>('/auth/login', data),
  
  register: (data: RegisterData) => 
    apiClient.post<{ message: string; token: string; user: User }>('/auth/register', data),
  
  getCurrentUser: () => 
    apiClient.get<User>('/auth/me'),
  
  logout: () => 
    apiClient.post<{ message: string }>('/auth/logout'),
};

// Customers API methods
export const customersAPI = {
  getAll: () => 
    apiClient.get<Customer[]>('/customers'),
  
  getById: (id: number) => 
    apiClient.get<Customer>(`/customers/${id}`),
  
  create: (data: CreateCustomerData) => 
    apiClient.post<{ message: string; customer: Customer }>('/customers', data),
  
  update: (id: number, data: Partial<Customer>) => 
    apiClient.put<{ message: string; customer: Customer }>(`/customers/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/customers/${id}`),
};

// Products API methods
export const productsAPI = {
  getAll: () => 
    apiClient.get<Product[]>('/products'),
  
  getById: (id: number) => 
    apiClient.get<Product>(`/products/${id}`),
  
  create: (data: CreateProductData) => 
    apiClient.post<{ message: string; product: Product }>('/products', data),
  
  update: (id: number, data: Partial<Product>) => 
    apiClient.put<{ message: string; product: Product }>(`/products/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/products/${id}`),
};

// Orders API methods
export const ordersAPI = {
  getAll: () => 
    apiClient.get<Order[]>('/orders'),
  
  create: (data: CreateOrderData) => 
    apiClient.post<{ message: string; order: Order }>('/orders', data),
  
  updateStatus: (id: number, status: string) => 
    apiClient.patch<{ message: string; order: Order }>(`/orders/${id}/status`, { status }),
};

// Files API methods (Existing file operations)
export const filesAPI = {
  getStoreFiles: (userId: number) => 
    apiClient.get<FileItem[]>(`/files/admin/store/${userId}`),
  
  downloadFile: async (userId: number, filePath: string): Promise<Blob> => {
    const url = `${API_BASE_URL}/files/admin/store/${userId}/download?file=${encodeURIComponent(filePath)}`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.blob();
  },
  
  previewFile: (userId: number, filePath: string) => 
    apiClient.get<FileContent>(`/files/admin/store/${userId}/preview?file=${encodeURIComponent(filePath)}`),
  
  exportAll: async (userId: number): Promise<Blob> => {
    const url = `${API_BASE_URL}/files/admin/export/${userId}`;
    
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return await response.blob();
  },
};

// View Files API methods (New file system operations)
export const viewFilesAPI = {
  // File System Operations
  getFolderStructure: (basePath?: string, relativePath?: string) => 
    apiClient.get<FolderStructure>(`/viewfiles/structure?basePath=${encodeURIComponent(basePath || '')}&relativePath=${encodeURIComponent(relativePath || '')}`),
  
  getFilePreview: (filePath: string, basePath?: string, maxSize?: number) => 
    apiClient.get<FileSystemContent>(`/viewfiles/preview?filePath=${encodeURIComponent(filePath)}&basePath=${encodeURIComponent(basePath || '')}&maxSize=${maxSize || 10485760}`),
  
  createItem: (basePath: string, itemPath: string, type: 'file' | 'directory', content?: string) => 
    apiClient.post<{ message: string; path: string }>('/viewfiles/create', { basePath, path: itemPath, type, content }),
  
  updateFile: (basePath: string, filePath: string, content: string) => 
    apiClient.put<{ message: string; path: string; size: number; modified: Date }>('/viewfiles/update', { basePath, path: filePath, content }),
  
  renameItem: (basePath: string, oldPath: string, newPath: string) => 
    apiClient.put<{ message: string; oldPath: string; newPath: string }>('/viewfiles/rename', { basePath, oldPath, newPath }),
  
  deleteItem: (basePath: string, itemPath: string, recursive?: boolean) => 
    apiClient.delete<{ message: string; path: string }>('/viewfiles/delete', { 
      basePath, 
      path: itemPath, 
      recursive: recursive || false 
    }),

  copyItem: (basePath: string, sourcePath: string, destinationPath: string) => 
    apiClient.post<{ message: string; sourcePath: string; destinationPath: string }>('/viewfiles/copy', { basePath, sourcePath, destinationPath }),
  
  moveItem: (basePath: string, sourcePath: string, destinationPath: string) => 
    apiClient.post<{ message: string; sourcePath: string; destinationPath: string }>('/viewfiles/move', { basePath, sourcePath, destinationPath }),
};

// Admin API methods
export const adminAPI = {
  getAllUsers: () => 
    apiClient.get<User[]>('/users'),
  
  suspendUser: (userId: number, password: string) => 
    apiClient.post<{ message: string }>(`/admin/users/${userId}/suspend`, { password }),
  
  unsuspendUser: (userId: number, password: string) => 
    apiClient.post<{ message: string }>(`/admin/users/${userId}/unsuspend`, { password }),
  
  deleteUser: (userId: number, password: string) => 
    apiClient.delete<{ message: string }>(`/admin/users/${userId}`, { body: JSON.stringify({ password }) }),
  
  getTenantTable: (userId: number, tableName: string) => 
    apiClient.get<any[]>(`/admin/tenant/${userId}/${tableName}`),
  
  getTenantTableColumns: (userId: number, tableName: string) => 
    apiClient.get<string[]>(`/admin/tenant/${userId}/${tableName}/columns`),
  
  getSubordinateWorkers: (userId: number) => 
    apiClient.get<SubordinateWorker[]>(`/admin/users/${userId}/subordinate-workers`),
};

// Subordinate Workers API methods
export const subordinatesAPI = {
  getAll: () => 
    apiClient.get<SubordinateWorker[]>('/subordinate-workers'),
  
  getById: (id: number) => 
    apiClient.get<SubordinateWorker>(`/subordinate-workers/${id}`),
  
  create: (data: Omit<SubordinateWorker, 'id' | 'created_at'>) => 
    apiClient.post<{ message: string; worker: SubordinateWorker }>('/subordinate-workers', data),
  
  update: (id: number, data: Partial<SubordinateWorker>) => 
    apiClient.put<{ message: string; worker: SubordinateWorker }>(`/subordinate-workers/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete<{ message: string }>(`/subordinate-workers/${id}`),
};

// Payments API methods
export const paymentsAPI = {
  getAll: () => 
    apiClient.get<PaymentData[]>('/payments'),
  
  create: (data: Omit<PaymentData, 'id'>) => 
    apiClient.post<{ message: string; payment: PaymentData }>('/payments', data),
};

// Subscriptions API methods
export const subscriptionsAPI = {
  getAll: () => 
    apiClient.get<SubscriptionData[]>('/subscriptions'),
  
  create: (data: Omit<SubscriptionData, 'id'>) => 
    apiClient.post<{ message: string; subscription: SubscriptionData }>('/subscriptions', data),
  
  getCurrent: () => 
    apiClient.get<SubscriptionData>('/subscriptions/current'),
};

// Utility functions for file operations
export const fileUtils = {
  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon: (fileName: string, isDirectory: boolean) => {
    if (isDirectory) return '📁';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
    
    if (imageExtensions.includes(ext || '')) return '🖼️';
    if (ext === 'pdf') return '📕';
    if (ext === 'doc' || ext === 'docx') return '📄';
    if (ext === 'xls' || ext === 'xlsx') return '📊';
    if (ext === 'zip' || ext === 'rar') return '📦';
    
    return '📄';
  },

  getFileTypeText: (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'file';
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'];
    
    if (imageExtensions.includes(ext)) return 'Image';
    if (ext === 'pdf') return 'PDF';
    if (ext === 'doc' || ext === 'docx') return 'Document';
    if (ext === 'xls' || ext === 'xlsx') return 'Spreadsheet';
    if (ext === 'zip' || ext === 'rar') return 'Archive';
    if (ext === 'txt' || ext === 'log') return 'Text File';
    if (ext === 'js' || ext === 'ts') return 'JavaScript';
    if (ext === 'json') return 'JSON';
    if (ext === 'html' || ext === 'css') return 'Web File';
    
    return ext.toUpperCase();
  }
};

// New File System Utility functions
export const fileSystemUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileIcon: (item: FileSystemItem): string => {
    if (item.isDirectory) return '📁';
    
    const ext = item.name.split('.').pop()?.toLowerCase();
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'md'];
    const spreadsheetExtensions = ['xls', 'xlsx', 'csv'];
    
    if (imageExtensions.includes(ext || '')) return '🖼️';
    if (codeExtensions.includes(ext || '')) return '📝';
    if (documentExtensions.includes(ext || '')) return '📄';
    if (spreadsheetExtensions.includes(ext || '')) return '📊';
    if (ext === 'zip' || ext === 'rar') return '📦';
    
    return '📄';
  },

  canPreview: (item: FileSystemItem): boolean => {
    if (item.isDirectory) return false;
    
    const ext = item.name.split('.').pop()?.toLowerCase();
    const previewableExtensions = [
      'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 
      'xml', 'csv', 'log', 'yml', 'yaml'
    ];
    
    return previewableExtensions.includes(ext || '') && item.size < 10485760; // 10MB limit
  },

  getFileType: (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const types: { [key: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SASS',
      'json': 'JSON',
      'xml': 'XML',
      'csv': 'CSV',
      'md': 'Markdown',
      'txt': 'Text',
      'pdf': 'PDF',
      'doc': 'Word Document',
      'docx': 'Word Document',
      'xls': 'Excel Spreadsheet',
      'xlsx': 'Excel Spreadsheet',
      'zip': 'Archive',
      'rar': 'Archive',
      'png': 'Image',
      'jpg': 'Image',
      'jpeg': 'Image',
      'gif': 'Image',
      'svg': 'Vector Image',
      'mp4': 'Video',
      'mp3': 'Audio'
    };
    
    return types[ext] || 'File';
  },

  formatDate: (date: Date): string => {
    return new Date(date).toLocaleString();
  }
};

export const adminCrudAPI = {
  // Generic CRUD operations
  create: (userId: number, table: string, data: any) => 
    apiClient.post<{ message: string; [key: string]: any }>(`/admin/crud/${userId}/${table}`, data),
  
  update: (userId: number, table: string, id: number, data: any) => 
    apiClient.put<{ message: string; [key: string]: any }>(`/admin/crud/${userId}/${table}/${id}`, data),
  
  delete: (userId: number, table: string, id: number) => 
    apiClient.delete<{ message: string }>(`/admin/crud/${userId}/${table}/${id}`),
  
  // Specific subordinate worker operations (if you create the specialized routes)
  createSubordinateWorker: (userId: number, data: any) => 
    apiClient.post<{ message: string; subordinateworker: any }>(`/admin/crud/${userId}/subordinateworkers`, data),
  
  updateSubordinateWorker: (userId: number, id: number, data: any) => 
    apiClient.put<{ message: string; subordinateworker: any }>(`/admin/crud/${userId}/subordinateworkers/${id}`, data),
  
  deleteSubordinateWorker: (userId: number, id: number) => 
    apiClient.delete<{ message: string }>(`/admin/crud/${userId}/subordinateworkers/${id}`),
};

// Export everything for convenience
export default {
  auth: authApi,
  customers: customersAPI,
  products: productsAPI,
  orders: ordersAPI,
  files: filesAPI, // Existing file operations
  viewfiles: viewFilesAPI, // New view files operations
  admin: adminAPI,
  subordinates: subordinatesAPI,
  payments: paymentsAPI,
  subscriptions: subscriptionsAPI,
  utils: fileUtils,
  fileSystemUtils: fileSystemUtils, // New file system utilities
  client: apiClient
};