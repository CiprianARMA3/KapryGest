// -------------------- LOAD ENV FIRST -------------------- //
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Use absolute path
const envPath = '/home/cipriankali/Desktop/KapryGest/backend/db/security_keys/.env';
console.log(`📁 Loading environment from: ${envPath}`);

const result = dotenvConfig({ path: envPath });
if (result.error) {
  console.error('❌ Failed to load .env file:', result.error);
} else {
  console.log('✅ Environment file loaded successfully');
}

// -------------------- IMPORT DEPENDENCIES -------------------- //
import express from 'express';
import cors from 'cors';
import 'reflect-metadata';
import { initAdminORM } from './config/database';
import routes from './routes';

const app = express();

// -------------------- MIDDLEWARE -------------------- //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Handle preflight requests
app.options('*', cors());

app.use(require('cookie-parser')());

// -------------------- ROUTES -------------------- //
app.use('/api', routes);

// -------------------- ROOT ROUTE -------------------- //
app.get('/', (req, res) => res.json({ 
  message: 'Server is up and running!',
  timestamp: new Date().toISOString()
}));

// -------------------- HEALTH CHECK -------------------- //
app.get('/health', (req, res) => res.json({ 
  status: 'OK',
  timestamp: new Date().toISOString(),
  database: 'Connected'
}));

// -------------------- START SERVER -------------------- //
async function main() {
  await initAdminORM();
  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server Status:`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🗄️  Admin Database: ${process.env.PG_GENERAL_DB}`);
    console.log(`🗄️  Users Database: ${process.env.PG_ACTIVITY_DB}`);
    console.log(`👤 Database User: ${process.env.PGUSER}`);
  });
}

main().catch(console.error);