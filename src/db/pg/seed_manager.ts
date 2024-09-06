import { FileMigrationProvider, Migrator } from 'kysely';

import { promises as fs } from 'fs';
import * as path from 'path';
import { Logger } from '../../utils/logging';
import postgresDb from './postgres_db';

const log = new Logger('KyselyMigrator');

// To be run only at the start of the databases lifecycle,
// should only ever run once.

export async function seedLatest() {
  const migrator = new Migrator({
    db: postgresDb,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, '../seeds')
    }),
    migrationTableName: 'seeds'
  });

  log.info('Running seeds up to latest');
  const { error, results } = await migrator.migrateTo('20240420_002_migrate_mongo_friendships');

  if (results && results.length === 0) {
    log.info('No data to seed :)');
  }

  results?.forEach((it) => {
    log.info(`Running seed ${it.migrationName}`);
    if (it.status === 'Success') {
      log.info(`Seed "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      log.error(`Failed to execute seed "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error(error as string);
    log.error('Failed to seed, rolled back and exiting');
    process.exit(1);
  }
}
