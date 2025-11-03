import { defineConfig } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config as dotenvConfig } from 'dotenv';
import path = require('path');

import { UserData } from './entities/admin-side/UserData';
import { PaymentData } from './entities/admin-side/PaymentData';
import { SubscriptionData } from './entities/admin-side/SubscriptionData';

// load .env first
dotenvConfig({ path: path.resolve(__dirname, '../db/security_keys/.env') });

export default defineConfig({
  driver: PostgreSqlDriver,
  clientUrl: process.env.DATABASE_URL_GENERALUSERS, // <-- use full URL
  entities: [UserData, PaymentData, SubscriptionData],
  debug: true,
});
