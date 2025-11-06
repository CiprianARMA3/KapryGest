import { Options } from '@mikro-orm/postgresql';

const config: Options = {
  driver: require('@mikro-orm/postgresql').PostgreSqlDriver,
  entities: ['./dist/entities/user-side/**/*.js'],
  entitiesTs: ['./src/entities/user-side/**/*.ts'],
  dbName: process.env.PG_ACTIVITY_DB || 'users_activitydb',
  user: process.env.PGUSER || 'ciprian',
  password: process.env.PGPASSWORD || 'deeaanamaria19',
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  debug: process.env.NODE_ENV === 'development',
};

export default config;