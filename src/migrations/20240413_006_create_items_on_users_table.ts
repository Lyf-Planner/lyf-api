import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('items_on_users')
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('item_id_fk', 'uuid', (col) => col.notNull().references('items.id'))
    .addColumn('user_id_fk', 'varchar(30)', (col) => col.notNull().references('users.id'))
    .addColumn('invite_pending', 'boolean', (col) => col.notNull())
    .addColumn('permission', 'text', (col) => col.notNull())
    .addColumn('sorting_rank', 'decimal', (col) => col.notNull())
    .addPrimaryKeyConstraint('pk_item_user', ['item_id_fk', 'user_id_fk'])
    .addCheckConstraint('check_permission', sql`permission IN (\'Owner\', \'Editor\', \'Read Only\')`)
    .execute();

  await db.schema.createIndex('item_user_item_id_index').on('items_on_users').column('item_id_fk').execute();
  await db.schema.createIndex('item_user_user_id_index').on('items_on_users').column('user_id_fk').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('items_on_users').execute();
}
