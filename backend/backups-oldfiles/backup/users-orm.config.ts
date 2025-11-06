import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config as dotenvConfig } from 'dotenv';
import path = require('path');

import { Customers } from './entities/user-side/Customers';
import { Invoice } from './entities/user-side/Invoices';
import { Order } from './entities/user-side/Orders';
import { PaymentLog } from './entities/user-side/PaymentLogs';
import { Product } from './entities/user-side/Products';
import { Stock } from './entities/user-side/Stocks';
import{SubordinateWorkers} from './entities/user-side/SubordinateWorkers';

// load .env first
dotenvConfig({ path: path.resolve(__dirname, '../db/security_keys/.env') });

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL_USERSACTIVITY, // <-- full URL
  entities: [Customers, Invoice, Order, PaymentLog, Product, Stock,SubordinateWorkers],
  debug: true,
});
