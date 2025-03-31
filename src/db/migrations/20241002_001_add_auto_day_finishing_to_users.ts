import { Kysely } from 'kysely';

import { Database } from '#/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('auto_day_finishing', 'boolean', (col) => col.defaultTo(true))
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('auto_day_finishing').execute();
}
