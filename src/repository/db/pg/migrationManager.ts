import * as path from 'path';
import { promises as fs } from 'fs';
import { Migrator, FileMigrationProvider } from 'kysely';
import { Logger } from '../../../utils/logging';
import postgresDb from './postgresDb';

const log = new Logger('KyselyMigrator');

export async function migrateToLatest() {
  const migrator = new Migrator({
    db: postgresDb,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, '../../../migrations')
    }),
    migrationTableName: 'migrations'
  });

  log.info('Running migrations up to latest');
  const { error, results } = await migrator.migrateToLatest();

  if (results && results.length === 0) {
    log.info('No migrations to run :)');
  }

  results?.forEach((it) => {
    if (it.status === 'Success') {
      log.info(`Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      log.error(`Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error(error);
    log.error('Failed to migrate, rolled back and exiting');
    process.exit(1);
  }
}
