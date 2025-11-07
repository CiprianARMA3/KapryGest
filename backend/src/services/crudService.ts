import { MikroORM } from '@mikro-orm/postgresql';
import usersConfig from '../config/users-orm.config';

export class CrudService {
  static async executeQuery(userId: number, query: string, params: any[] = []) {
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    
    try {
      const result = await conn.execute(query, params);
      return result;
    } finally {
      await usersOrm.close();
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