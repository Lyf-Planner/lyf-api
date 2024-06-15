import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('notes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('title', 'varchar(80)', (col) => col.notNull())
    .addColumn('type', 'text', (col) => col.notNull())
    .addColumn('content', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('notes').execute();
}
