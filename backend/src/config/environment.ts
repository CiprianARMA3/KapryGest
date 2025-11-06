export const environment = {
  jwtSecret: process.env.JWT_SECRET || 'cipriankey',
  jwtExpiry: '7d',
  suspendDeletePassword: process.env.SUSPENDDELETEUSER || 'cipriankey',
  baseStorePath: '/home/cipriankali/Desktop/KapryGest/backend/db/store',
  bcryptRounds: Number(process.env.BCRYPT_HASH) || 10,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  db: {
    user: process.env.PGUSER || 'ciprian',
    password: process.env.PGPASSWORD || 'deeaanamaria19',
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    generalDb: process.env.PG_GENERAL_DB || 'general_usersdb',
    activityDb: process.env.PG_ACTIVITY_DB || 'users_activitydb'
  }
};