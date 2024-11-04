import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('notes')
    .addColumn('collaborative_parent_id', 'uuid', col => col.references('notes.id').onDelete('set null'))
    .execute();

  await db.schema
    .createIndex('note_collaborative_parent_id_index')
    .on('notes')
    .column('collaborative_parent_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('note_collaborative_parent_id_index')
    .execute();

  await db.schema
    .alterTable('notes')
    .dropColumn('collaborative_parent_id')
    .execute();
}