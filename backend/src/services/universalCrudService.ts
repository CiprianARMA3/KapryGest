// services/universalCrudService.ts
import { CrudService } from './crudService';

export interface TableColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export interface CrudResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export class UniversalCrudService {
  
  /**
   * Get table structure for a user's table
   */
  static async getTableStructure(userId: number, table: string): Promise<TableColumnInfo[]> {
    try {
      const result = await CrudService.executeQuery(
        userId,
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns 
         WHERE table_name = ? AND table_schema = 'public'
         ORDER BY ordinal_position`,
        [`${table}_${userId}`]
      );
      return result as TableColumnInfo[];
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error getting table structure for ${table}_${userId}:`, errorMessage);
      return [];
    }
  }

  /**
   * Get all records from a table
   */
  static async getAllRecords(userId: number, table: string, limit: number = 100, offset: number = 0): Promise<CrudResult> {
    try {
      const tableName = `${table}_${userId}`;
      
      // Check if table exists
      const tableExists = await this.tableExists(userId, table);
      if (!tableExists) {
        return { success: true, data: [] }; // Return empty array if table doesn't exist
      }

      const records = await CrudService.executeQuery(
        userId,
        `SELECT * FROM ${tableName} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return { success: true, data: records };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error getting records from ${table}_${userId}:`, errorMessage);
      return { success: false, error: `Failed to fetch ${table} records` };
    }
  }

  /**
   * Get single record by ID
   */
  static async getRecordById(userId: number, table: string, id: number): Promise<CrudResult> {
    try {
      const tableName = `${table}_${userId}`;
      const records = await CrudService.executeQuery(
        userId,
        `SELECT * FROM ${tableName} WHERE id = ?`,
        [id]
      );

      if (records.length === 0) {
        return { success: false, error: `${table} not found` };
      }

      return { success: true, data: records[0] };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error getting ${table} with ID ${id}:`, errorMessage);
      return { success: false, error: `Failed to fetch ${table}` };
    }
  }

  /**
   * Create a new record
   */
// services/universalCrudService.ts - UPDATED createRecord method
static async createRecord(userId: number, table: string, data: any): Promise<CrudResult> {
  try {
    const tableName = `${table}_${userId}`;
    
    console.log('🔍 Universal CRUD - Starting create record:', {
      userId,
      table,
      tableName,
      inputData: data
    });

    // Get table structure to validate columns
    const tableStructure = await this.getTableStructure(userId, table);
    const existingColumns = tableStructure.map(col => col.column_name);
    
    console.log('🔍 Table structure:', {
      tableName,
      existingColumns,
      tableStructure
    });
    
    // Filter out columns that don't exist in the table and remove undefined values
    const validData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (existingColumns.includes(key) && value !== undefined && value !== null && value !== '') {
        validData[key] = value;
      }
    }

    // Remove ID if present (should be auto-generated)
    delete validData.id;
    delete validData.created_at;
    delete validData.updated_at;

    console.log('🔍 Filtered valid data:', validData);

    if (Object.keys(validData).length === 0) {
      console.warn('❌ No valid data after filtering');
      return { success: false, error: 'No valid data provided for insertion' };
    }

    const columns = Object.keys(validData);
    const values = Object.values(validData);
    const placeholders = columns.map(() => '?').join(', ');

    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) 
                   VALUES (${placeholders}) RETURNING *`;

    console.log('🚀 Final INSERT query:', { query, values });

    const result = await CrudService.executeQuery(userId, query, values);
    
    console.log('✅ INSERT successful:', result);
    
    return { 
      success: true, 
      data: result[0],
      message: `${table} created successfully`
    };
  } catch (error) {
    const errorMessage = this.getErrorMessage(error);
    console.error('❌ INSERT failed:', {
      error: errorMessage,
      table: `${table}_${userId}`,
      data
    });
    return { success: false, error: `Failed to create ${table}: ${errorMessage}` };
  }
}

  /**
   * Update an existing record
   */
  static async updateRecord(userId: number, table: string, id: number, data: any): Promise<CrudResult> {
    try {
      const tableName = `${table}_${userId}`;
      
      // Check if record exists
      const existingRecord = await this.getRecordById(userId, table, id);
      if (!existingRecord.success) {
        return existingRecord;
      }

      // Get table structure to validate columns
      const tableStructure = await this.getTableStructure(userId, table);
      const existingColumns = tableStructure.map(col => col.column_name);
      
      // Filter out columns that don't exist and protected fields
      const validData: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (existingColumns.includes(key) && 
            !['id', 'created_at'].includes(key) && 
            value !== undefined && 
            value !== null) {
          validData[key] = value;
        }
      }

      if (Object.keys(validData).length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }

      const updates = Object.keys(validData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(validData), id];

      const query = `UPDATE ${tableName} SET ${updates} WHERE id = ? RETURNING *`;

      console.log(`Updating ${table} ${id}:`, { query, values });

      const result = await CrudService.executeQuery(userId, query, values);
      
      return { 
        success: true, 
        data: result[0],
        message: `${table} updated successfully`
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error updating ${table} ${id}:`, errorMessage);
      return { success: false, error: `Failed to update ${table}` };
    }
  }

  /**
   * Delete a record
   */
  static async deleteRecord(userId: number, table: string, id: number): Promise<CrudResult> {
    try {
      const tableName = `${table}_${userId}`;
      
      // Check if record exists
      const existingRecord = await this.getRecordById(userId, table, id);
      if (!existingRecord.success) {
        return existingRecord;
      }

      await CrudService.executeQuery(
        userId,
        `DELETE FROM ${tableName} WHERE id = ?`,
        [id]
      );

      return { 
        success: true, 
        message: `${table} deleted successfully` 
      };
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error deleting ${table} ${id}:`, errorMessage);
      return { success: false, error: `Failed to delete ${table}` };
    }
  }

  /**
   * Check if a table exists
   */
  static async tableExists(userId: number, table: string): Promise<boolean> {
    try {
      const result = await CrudService.executeQuery(
        userId,
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ?
        )`,
        [`${table}_${userId}`]
      );
      
      return result[0].exists;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error checking if table ${table}_${userId} exists:`, errorMessage);
      return false;
    }
  }

  /**
   * Get table columns for form generation
   */
  static async getTableColumns(userId: number, table: string): Promise<string[]> {
    try {
      const structure = await this.getTableStructure(userId, table);
      return structure.map(col => col.column_name);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error getting columns for ${table}_${userId}:`, errorMessage);
      return [];
    }
  }

  /**
   * Get field types for dynamic form generation
   */
  static async getFieldTypes(userId: number, table: string): Promise<Record<string, string>> {
    try {
      const structure = await this.getTableStructure(userId, table);
      const fieldTypes: Record<string, string> = {};
      
      structure.forEach(col => {
        // Map PostgreSQL types to form field types
        if (col.data_type.includes('int') || col.data_type.includes('numeric') || col.data_type.includes('decimal')) {
          fieldTypes[col.column_name] = 'number';
        } else if (col.data_type.includes('bool')) {
          fieldTypes[col.column_name] = 'checkbox';
        } else if (col.data_type.includes('date') || col.data_type.includes('time')) {
          fieldTypes[col.column_name] = 'date';
        } else if (col.column_name.includes('email')) {
          fieldTypes[col.column_name] = 'email';
        } else if (col.column_name.includes('password')) {
          fieldTypes[col.column_name] = 'password';
        } else {
          fieldTypes[col.column_name] = 'text';
        }
      });
      
      return fieldTypes;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Error getting field types for ${table}_${userId}:`, errorMessage);
      return {};
    }
  }

  /**
   * Safe error message extraction
   */
  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  }
}