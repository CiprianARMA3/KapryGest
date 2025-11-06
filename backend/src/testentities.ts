import { MikroORM } from '@mikro-orm/postgresql';
import adminConfig from './config/admin-orm.config';
import usersConfig from './config/users-orm.config';

async function testDatabase() {
  try {
    console.log('🔄 Testing admin database connection...');
    console.log('Database:', process.env.PG_GENERAL_DB);
    console.log('User:', process.env.PGUSER);
    console.log('Host:', process.env.PGHOST);
    
    const adminOrm = await MikroORM.init(adminConfig);
    console.log('✅ Admin database connected successfully!');
    
    const metadata = adminOrm.getMetadata();
    const entities = metadata.getAll();
    console.log('✅ Admin entities discovered:', Object.keys(entities));
    
    await adminOrm.close();
    console.log('✅ Admin database connection closed.');
    
    console.log('\n🔄 Testing users database connection...');
    const usersOrm = await MikroORM.init(usersConfig);
    console.log('✅ Users database connected successfully!');
    await usersOrm.close();
    console.log('✅ Users database connection closed.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();