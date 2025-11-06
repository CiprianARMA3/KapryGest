import { MikroORM } from '@mikro-orm/postgresql';
import adminConfig from './admin-orm.config';

let orm: MikroORM;

export async function initAdminORM() {
  try {
    orm = await MikroORM.init(adminConfig);
    console.log('✅ Admin database connected.');
    return orm;
  } catch (err) {
    console.error('❌ Failed to connect to admin database:', err);
    process.exit(1);
  }
}

export function getORM() {
  if (!orm) {
    throw new Error('Database not initialized. Call initAdminORM first.');
  }
  return orm;
}