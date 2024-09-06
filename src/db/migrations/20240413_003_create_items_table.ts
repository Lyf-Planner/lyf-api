import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('items')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('title', 'varchar(80)', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull())
    .addColumn('tz', 'text', (col) => col.notNull())
    .addColumn('collaborative', 'boolean', (col) => col.notNull())
    .addColumn('date', 'varchar(10)')
    .addColumn('day', 'text')
    .addColumn('desc', 'text')
    .addColumn('time', 'varchar(5)')
    .addColumn('end_time', 'varchar(5)')
    .addColumn('note_id', 'uuid', (col) => col.references('notes.id'))
    .addColumn('template_id', 'uuid', (col) => col.references('items.id'))
    .addColumn('url', 'text')
    .addColumn('location', 'text')
    .addColumn('default_show_in_upcoming', 'boolean')
    .addColumn('default_notification_mins', 'integer')
    .addColumn('default_sorting_rank', 'decimal')
    .execute();

  await db.schema.createIndex('item_date_index').on('items').column('date desc').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('items').execute();
}
