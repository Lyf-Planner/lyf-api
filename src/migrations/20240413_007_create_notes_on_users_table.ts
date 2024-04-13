import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('notes_on_users')
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('note_id_fk', 'uuid', (col) => col.notNull().references('notes.note_id'))
    .addColumn('user_id_fk', 'uuid', (col) => col.notNull().references('users.user_id'))
    .addColumn('invite_pending', 'boolean', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addCheckConstraint('check_status', sql`status IN (\'Owner\', \'Editor\', \'Read Only\')`)
    .execute();

    await db.schema
    .createIndex('user_note_user_id_index')
    .on('notes_on_users')
    .column('user_id_fk')
    .execute();
  await db.schema
    .createIndex('user_note_note_id_index')
    .on('notes_on_users')
    .column('note_id_fk')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notes_on_users').execute();
}
