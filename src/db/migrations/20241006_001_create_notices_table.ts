import { sql, Kysely } from 'kysely';

import { Database } from '#/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createType('notice_type_enum')
    .asEnum(['feature', 'warning'])
    .execute();

  await db.schema
    .createTable('notices')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('version', 'varchar', (col) => col.notNull())
    .addColumn('type', 'varchar', (col) => col.notNull())
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('image_url', 'varchar')
    .addColumn('expiry', 'date')
    .execute();

  await db.schema.createIndex('notice_version_index').on('notices').column('version').execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('notices').execute();

  await db.schema.dropType('notice_type_enum').execute();
}
