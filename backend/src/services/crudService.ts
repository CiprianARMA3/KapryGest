import { MikroORM } from '@mikro-orm/postgresql';
import usersConfig from '../config/users-orm.config';

// services/crudService.ts - Add logging
export class CrudService {
  static async executeQuery(userId: number, query: string, params: any[] = []): Promise<any> {
    try {
      console.log('📊 CrudService executing query:', {
        userId,
        query,
        params
      });

      const usersOrm = await MikroORM.init(usersConfig);
      const conn = usersOrm.em.getConnection();
      
      const result = await conn.execute(query, params);
      
      console.log('📊 CrudService query result:', {
        rowsAffected: result.length,
        result: result
      });
      
      await usersOrm.close();
      return result;
    } catch (error) {
      console.error('❌ CrudService query failed:', {
        error: getErrorMessage(error),
        query,
        params
      });
      throw error;
    }
  }

  static async tableExists(userId: number, tableName: string): Promise<boolean> {
    const result = await this.executeQuery(
      userId,
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ?)`,
      [`${tableName}_${userId}`]
    );
    return result[0].exists;
  }
}

function getErrorMessage(error: unknown) {
  throw new Error('Function not implemented.');
}
