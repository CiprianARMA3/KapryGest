import { MikroORM } from '@mikro-orm/postgresql';
import usersConfig from '../config/users-orm.config';

export class DatabaseService {
  static async executeUserQuery(userId: number, query: string, params: any[] = []) {
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
    const result = await this.executeUserQuery(
      userId,
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
      [tableName]
    );
    return result[0].exists;
  }

  static async createSubordinateWorkersTable(userId: number): Promise<void> {
    const tableName = `subordinateworkers_${userId}`;
    
    await this.executeUserQuery(userId, `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        email VARCHAR(256) NOT NULL,
        phone_number BIGINT NOT NULL,
        role VARCHAR(100) NOT NULL,
        password VARCHAR(256) NOT NULL,
        permissions JSONB,
        logs JSONB,
        user_id INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, user_id)
      );
    `);
  }
}