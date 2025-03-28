import { Kysely } from 'kysely';

import { Database } from '../../../schema/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('weather_data', 'boolean')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('weather_data').execute();
}
