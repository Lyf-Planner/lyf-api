import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('notes_on_users')
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('note_id_fk', 'uuid', (col) => col.notNull().references('notes.id'))
    .addColumn('user_id_fk', 'varchar(30)', (col) => col.notNull().references('users.id'))
    .addColumn('invite_pending', 'boolean', (col) => col.notNull())
    .addColumn('permission', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('pk_note_user', ['user_id_fk', 'note_id_fk'])
    .execute();

  await db.schema
    .createIndex('note_user_user_id_index')
    .on('notes_on_users')
    .column('user_id_fk')
    .execute();
  await db.schema
    .createIndex('note_user_note_id_index')
    .on('notes_on_users')
    .column('note_id_fk')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notes_on_users').execute();
}
