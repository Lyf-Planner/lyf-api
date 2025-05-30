import { Kysely } from 'kysely';

import { Database } from '#/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('note_children')
    .addColumn('sorting_rank', 'integer', (col) => col.defaultTo('0'))
    .execute();

  await db.schema
    .alterTable('notes')
    .addColumn('default_sorting_rank', 'integer', (col) => col.defaultTo('0'))
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('note_children').dropColumn('sorting_rank').execute();
  await db.schema.alterTable('notes').dropColumn('default_sorting_rank').execute();
}
