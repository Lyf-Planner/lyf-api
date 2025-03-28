import { Kysely } from 'kysely';

import { Database } from '../../../schema/database';

// the sorting rank that gets used in the root should be a user preference
// this should not be inherent to the note as that will cause users to muck up each other's roots

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('notes').dropColumn('default_sorting_rank').execute();

  await db.schema
    .alterTable('notes_on_users')
    .addColumn('sorting_rank_preference', 'integer', (col) => col.defaultTo('0'))
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('notes')
    .addColumn('default_sorting_rank', 'integer', (col) => col.defaultTo('0'))
    .execute();

  await db.schema.alterTable('notes_on_users').dropColumn('sorting_rank_preference').execute();
}
