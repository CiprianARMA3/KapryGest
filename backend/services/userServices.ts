import { MikroORM } from '@mikro-orm/postgresql';
import path = require('path');
import fs = require('fs');
import fsPromises = require('fs/promises');

/**
 * Creates dynamic tenant tables for a specific user
 */
export async function createUserTenantTables(userId: number, orm: MikroORM) {
  const conn = orm.em.getConnection();

  const tablesSQL = [
    `CREATE TABLE IF NOT EXISTS customers_${userId} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      surname VARCHAR(100),
      billing_address VARCHAR(255),
      phone_number VARCHAR(20)
    );`,

    `CREATE TABLE IF NOT EXISTS orders_${userId} (
      id SERIAL PRIMARY KEY,
      product_id INT,
      quantity INT,
      TVA FLOAT,
      total FLOAT,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW(),
      data_invoices JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS products_${userId} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      category VARCHAR(50),
      price FLOAT,
      reduced_percentage FLOAT,
      description TEXT,
      data JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS stocks_${userId} (
      id SERIAL PRIMARY KEY,
      product_id INT,
      product_name VARCHAR(100),
      amount INT,
      purchased_date DATE,
      expiry_date DATE
    );`,

    `CREATE TABLE IF NOT EXISTS invoices_${userId} (
      id SERIAL PRIMARY KEY,
      order_id INT,
      date DATE,
      data_invoices JSONB
    );`,

    `CREATE TABLE IF NOT EXISTS paymentlogs_${userId} (
      id SERIAL PRIMARY KEY,
      invoice_id INT,
      invoice_date DATE,
      status VARCHAR(50),
      payment_date TIMESTAMP DEFAULT NOW(),
      payment_type VARCHAR(100),
      price INT,
      amount INT,
      billing_address VARCHAR(255),
      phone_number VARCHAR(20),
      data_invoices JSONB
    );`,
  ];

  for (const sql of tablesSQL) {
    await conn.execute(sql);
  }

  console.log(`Dynamic tenant tables created for user ${userId}`);
}

/**
 * Creates folder structure for a user
 */
export async function createUserFolders(userId: number) {
  const basePath = path.resolve(__dirname, '../db/store', userId.toString());
  const folders = ['images-products', 'invoices'];

  try {
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    for (const folder of folders) {
      const folderPath = path.join(basePath, folder);
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    }

    const dataPath = path.join(basePath, 'data.json');
    if (!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify({ products: [], invoices: [] }, null, 2));
    }

    console.log(`Folder structure created for user ${userId}`);
  } catch (err) {
    console.error('Error creating user folders:', err);
    throw err;
  }
}
