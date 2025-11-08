// services/subordinateWorkerService.ts
import { CrudService } from './crudService';

export interface SubordinateWorkerResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class SubordinateWorkerService {
  static async createSubordinateWorker(userId: number, data: any): Promise<SubordinateWorkerResult> {
    try {
      const tableName = `subordinateworkers_${userId}`;
      
      const { name, surname, email, phone_number, role, password } = data;
      
      // Validate required fields
      if (!name || !surname || !email || !role || !password) {
        return { 
          success: false, 
          error: 'Name, surname, email, role, and password are required' 
        };
      }

      const query = `
        INSERT INTO ${tableName} (name, surname, email, phone_number, role, password, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW()) RETURNING *
      `;
      
      const params = [name, surname, email, phone_number || '', role, password];
      
      console.log('📊 Creating subordinate worker:', { tableName, query, params });
      
      const result = await CrudService.executeQuery(userId, query, params);
      
      return {
        success: true,
        data: result[0],
        message: 'Subordinate worker created successfully'
      };
    } catch (error) {
      console.error('❌ Create subordinate worker failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subordinate worker'
      };
    }
  }

  static async updateSubordinateWorker(userId: number, id: number, data: any): Promise<SubordinateWorkerResult> {
    try {
      const tableName = `subordinateworkers_${userId}`;
      
      const { name, surname, email, phone_number, role } = data;
      
      const updates = [];
      const params = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (surname !== undefined) {
        updates.push('surname = ?');
        params.push(surname);
      }
      if (email !== undefined) {
        updates.push('email = ?');
        params.push(email);
      }
      if (phone_number !== undefined) {
        updates.push('phone_number = ?');
        params.push(phone_number);
      }
      if (role !== undefined) {
        updates.push('role = ?');
        params.push(role);
      }
      
      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }
      
      params.push(id);
      
      const query = `
        UPDATE ${tableName} 
        SET ${updates.join(', ')} 
        WHERE id = ? 
        RETURNING *
      `;
      
      console.log('📊 Updating subordinate worker:', { tableName, query, params });
      
      const result = await CrudService.executeQuery(userId, query, params);
      
      if (result.length === 0) {
        return { success: false, error: 'Subordinate worker not found' };
      }
      
      return {
        success: true,
        data: result[0],
        message: 'Subordinate worker updated successfully'
      };
    } catch (error) {
      console.error('❌ Update subordinate worker failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update subordinate worker'
      };
    }
  }

  static async deleteSubordinateWorker(userId: number, id: number): Promise<SubordinateWorkerResult> {
    try {
      const tableName = `subordinateworkers_${userId}`;
      
      const query = `DELETE FROM ${tableName} WHERE id = ?`;
      
      console.log('📊 Deleting subordinate worker:', { tableName, query, id });
      
      await CrudService.executeQuery(userId, query, [id]);
      
      return {
        success: true,
        message: 'Subordinate worker deleted successfully'
      };
    } catch (error) {
      console.error('❌ Delete subordinate worker failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete subordinate worker'
      };
    }
  }
}