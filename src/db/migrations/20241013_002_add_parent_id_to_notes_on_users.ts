import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('notes_on_users')
    .addColumn('parent_id', 'uuid', col => col.references('notes.id').onDelete('set null'))
    .execute();

  await db.schema
    .createIndex('notes_on_users_parent_id_index')
    .on('notes')
    .column('parent_id')
    .column('user_id_fk')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex('notes_on_users_parent_id_index')
    .execute();

  await db.schema
    .alterTable('notes_on_users')
    .dropColumn('parent_id')
    .execute();
}