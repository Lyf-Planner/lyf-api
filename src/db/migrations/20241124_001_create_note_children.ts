import { sql, Kysely } from 'kysely';

import { Database } from '../../../schema/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('note_children')
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('parent_id', 'uuid', (col) => col.notNull().references('notes.id'))
    .addColumn('child_id', 'uuid', (col) => col.notNull().references('notes.id'))
    .addColumn('distance', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('pk_note_children', ['parent_id', 'child_id'])
    .execute();

  await db.schema.createIndex('parent_id_index').on('note_children').column('parent_id').execute();
  await db.schema.createIndex('child_id_index').on('note_children').column('child_id').execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('note_children').execute();
}
