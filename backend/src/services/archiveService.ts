import fsPromises from 'fs/promises';
import { MikroORM } from '@mikro-orm/postgresql';
import usersConfig from '../config/users-orm.config';
import { BASE_STORE_PATH } from '../config/auth';

export class ArchiveService {
  static async updateSubordinateWorkersArchive(userId: number): Promise<any> {
    try {
      console.log(`\n🔄 ARCHIVE UPDATE FOR USER ${userId}`);
      
      const archiveDataPath = `${BASE_STORE_PATH}/${userId}/archive/data.json`;
      
      // Get data from database
      const usersOrm = await MikroORM.init(usersConfig);
      const conn = usersOrm.em.getConnection();
      
      const tableName = `subordinateworkers_${userId}`;
      let workers: any[] = [];
      
      console.log(`📊 Querying table: ${tableName}`);
      
      try {
        workers = await conn.execute(`SELECT * FROM ${tableName}`);
        console.log(`✅ Database returned ${workers.length} workers`);
        
        workers.forEach(worker => {
          console.log(`   👤 ${worker.name} ${worker.surname} (ID: ${worker.id})`);
        });
        
      } catch (err) {
        console.log(`❌ Database query failed:`, err);
        workers = [];
      }
      
      await usersOrm.close();

      // Prepare archive data
      const activeWorkers = workers.filter(worker => worker.is_active);
      const archivedWorkers = workers.filter(worker => !worker.is_active);
      
      const archiveData = {
        userId: userId,
        createdAt: new Date().toISOString(),
        subordinateWorkers: {
          totalCount: workers.length,
          activeWorkers: activeWorkers,
          archivedWorkers: archivedWorkers,
          permissionsHistory: [],
          activityLogs: []
        },
        lastUpdated: new Date().toISOString()
      };

      console.log(`📁 Archive data: ${activeWorkers.length} active, ${archivedWorkers.length} archived`);

      // Write to file
      await fsPromises.writeFile(archiveDataPath, JSON.stringify(archiveData, null, 2));
      console.log(`✅ Archive file updated at: ${archiveDataPath}`);

      return archiveData;

    } catch (err) {
      console.error(`💥 Archive update failed:`, err);
      throw err;
    }
  }
}