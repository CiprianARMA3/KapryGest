import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import pkg from "pg";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "security_keys/.env") });

export const general_usersDB = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PG_GENERAL_DB,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

export const users_activityDB = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PG_ACTIVITY_DB,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
});

async function verifyTablePresence() {
  try {
    await general_usersDB.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        id BIGSERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        birthdate DATE NOT NULL,
        active_subscription VARCHAR(1),
        expired BOOLEAN NOT NULL,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        phone_number VARCHAR(11) NOT NULL,
        suspended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin BOOLEAN DEFAULT FALSE
      );
    `);

    await general_usersDB.query(`
      CREATE TABLE IF NOT EXISTS subscription_data (
        id BIGSERIAL PRIMARY KEY,
        payment_date DATE NOT NULL,
        expiry_date DATE NOT NULL
      );
    `);

    await general_usersDB.query(`
      CREATE TABLE IF NOT EXISTS payment_data (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        purchase_date DATE NOT NULL,
        payment_type VARCHAR(50) NOT NULL,
        billing_address VARCHAR(200) NOT NULL,
        phone_number VARCHAR(11) NOT NULL
      );
    `);

    logger.info("OPERATIONAL general_usersDB");
  } catch (err) {
    logger.error({ err }, "ERROR verifying tables");
  }
}

export async function testDBConnections() {
  try {
    const res1 = await general_usersDB.query("SELECT NOW()");
    logger.info({ time: res1.rows[0] }, "DB general_usersDB CONNECTION SUCCESSFUL");

    const res2 = await users_activityDB.query("SELECT NOW()");
    logger.info({ time: res2.rows[0] }, "DB users_activityDB CONNECTION SUCCESSFUL");
  } catch (err) {
    logger.error({ err }, "NO DB CONNECTION");
  }
}

if (process.argv[1].includes("connection.js")) {
  (async () => {
    await testDBConnections();
    await verifyTablePresence();
    await general_usersDB.end();
    await users_activityDB.end();
  })();
}