const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const adminAPI = {
  // Auth
  getMe: () => fetch(`${API_BASE}/auth/me`, { credentials: "include" }),
  
  // Users
  getUsers: () => fetch(`${API_BASE}/users`, { credentials: "include" }),
  
  // User Actions
  suspendUser: (userId: number, password: string) => 
    fetch(`${API_BASE}/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ password })
    }),
    
  unsuspendUser: (userId: number, password: string) => 
    fetch(`${API_BASE}/admin/users/${userId}/unsuspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ password })
    }),
    
  deleteUser: (userId: number, password: string) => 
    fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: JSON.stringify({ password })
    }),
  
  // Files
  getStoreFiles: (userId: number) => 
    fetch(`${API_BASE}/files/admin/store/${userId}`, { credentials: "include" }),
    
  downloadFile: (userId: number, filePath: string) => 
    fetch(`${API_BASE}/files/admin/store/${userId}/download?file=${encodeURIComponent(filePath)}`, { 
      credentials: "include" 
    }),
    
  previewFile: (userId: number, filePath: string) => 
    fetch(`${API_BASE}/files/admin/store/${userId}/preview?file=${encodeURIComponent(filePath)}`, { 
      credentials: "include" 
    }),
    
  exportUserData: (userId: number) => 
    fetch(`${API_BASE}/files/admin/export/${userId}`, { credentials: "include" }),
  
  // Tenant Data
  getTenantTable: (userId: number, table: string) => 
    fetch(`${API_BASE}/admin/tenant/${userId}/${table}`, { credentials: "include" }),
    
  getTableColumns: (userId: number, table: string) => 
    fetch(`${API_BASE}/admin/tenant/${userId}/${table}/columns`, { credentials: "include" }),
  
  // Subordinate Workers
  getSubordinateWorkers: (userId: number) => 
    fetch(`${API_BASE}/admin/users/${userId}/subordinate-workers`, { credentials: "include" })
};