
import { promises as fs } from 'fs';
import * as path from 'path';

import { FileMigrationProvider, Migrator } from 'kysely';

import { Logger } from '../utils/logging';

import postgresDb from './pg/postgres_db';

export const migrator = new Migrator({
  db: postgresDb,
  provider: new FileMigrationProvider({
    fs,
    path,
    // This needs to be an absolute path.
    migrationFolder: path.join(__dirname, './migrations')
  }),
  migrationTableName: 'migrations'
});

export const dataMigrator = new Migrator({
  db: postgresDb,
  provider: new FileMigrationProvider({
    fs,
    path,
    // This needs to be an absolute path.
    migrationFolder: path.join(__dirname, './data_migrations')
  }),
  migrationTableName: 'data_migrations'
});

type MigratorType = 'Migrator' | 'DataMigrator';

export async function migrateToLatest(migrator: Migrator, type: MigratorType) {
  const log = new Logger(type);

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
    log.error(error as string);
    log.error('Failed to migrate, rolled back and exiting');
    process.exit(1);
  }
}

export const migrateDatabase = async () => {
  await migrateToLatest(migrator, 'Migrator');
  await migrateToLatest(dataMigrator, 'DataMigrator')
}
