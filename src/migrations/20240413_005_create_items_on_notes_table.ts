import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('items_on_notes')
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('item_id_fk', 'uuid', (col) => col.notNull().references('items.id'))
    .addColumn('note_id_fk', 'uuid', (col) => col.notNull().references('notes.note_id'))
    .addPrimaryKeyConstraint('pk_item_note', ['item_id_fk', 'note_id_fk'])
    .execute();

  await db.schema
    .createIndex('item_note_item_id_index')
    .on('items_on_notes')
    .column('item_id_fk')
    .execute();
  await db.schema
    .createIndex('item_note_note_id_index')
    .on('items_on_notes')
    .column('note_id_fk')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('items_on_notes').execute();
}
