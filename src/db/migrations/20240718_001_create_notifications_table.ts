import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('to', 'varchar(30)', (col) => col.references('users.id'))
    .addColumn('from', 'varchar(30)')
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('message', 'text')
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('seen', 'boolean', (col) => col.notNull())
    .addColumn('received', 'boolean', (col) => col.notNull())
    .addColumn('related_data', 'text', (col) => col.notNull())
    .addColumn('related_id', 'text')
    .execute();

  await db.schema.createIndex('notification_to_index').on('notifications').column('to').execute();
  await db.schema.createIndex('notification_created_index').on('notifications').column('created').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notifications').execute();
}
