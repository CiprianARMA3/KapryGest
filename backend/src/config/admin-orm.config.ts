import { Options } from '@mikro-orm/postgresql';
import path from 'path';

const config: Options = {
  driver: require('@mikro-orm/postgresql').PostgreSqlDriver,
  entities: ['./dist/entities/admin-side/**/*.js'],
  entitiesTs: ['./src/entities/admin-side/**/*.ts'],
  dbName: process.env.PG_GENERAL_DB || 'general_usersdb',
  user: process.env.PGUSER || 'ciprian',
  password: process.env.PGPASSWORD || 'deeaanamaria19',
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  debug: process.env.NODE_ENV === 'development',
  migrations: {
    path: path.join(__dirname, '../migrations'),
  },
};

export default config;