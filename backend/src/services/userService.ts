import { MikroORM } from '@mikro-orm/postgresql';
import usersConfig from '../config/users-orm.config';

export class UserService {
  static async createUserTenantTables(userId: number): Promise<void> {
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    
    const tables = [
      `CREATE TABLE IF NOT EXISTS customers_${userId} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        billing_address VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS orders_${userId} (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        TVA DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        data_invoices JSONB
      );`,
      
      `CREATE TABLE IF NOT EXISTS products_${userId} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        reduced_percentage DECIMAL(5,2) NOT NULL,
        description TEXT NOT NULL,
        data JSONB
      );`,
      
      `CREATE TABLE IF NOT EXISTS stocks_${userId} (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        amount INTEGER NOT NULL,
        purchased_date DATE NOT NULL,
        expiry_date DATE NOT NULL
      );`,
      
      `CREATE TABLE IF NOT EXISTS invoices_${userId} (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        date DATE NOT NULL,
        data_invoices JSONB
      );`,
      
      `CREATE TABLE IF NOT EXISTS paymentlogs_${userId} (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL,
        invoice_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL,
        payment_date TIMESTAMPTZ DEFAULT NOW(),
        payment_type VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        billing_adress VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        data_invoices JSONB
      );`,
      
      `CREATE TABLE IF NOT EXISTS subordinateworkers_${userId} (
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
      );`
    ];

    for (const tableSql of tables) {
      await conn.execute(tableSql);
    }
    
    await usersOrm.close();
    console.log(`✅ Tenant tables created for user ${userId}`);
  }

  static async dropUserTenantTables(userId: number): Promise<void> {
    const usersOrm = await MikroORM.init(usersConfig);
    const conn = usersOrm.em.getConnection();
    const tables = ['customers', 'orders', 'products', 'stocks', 'invoices', 'paymentlogs', 'subordinateworkers'];

    for (const table of tables) {
      const tableName = `${table}_${userId}`;
      await conn.execute(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
      console.log(`✅ Dropped table: ${tableName}`);
    }

    await usersOrm.close();
  }
}