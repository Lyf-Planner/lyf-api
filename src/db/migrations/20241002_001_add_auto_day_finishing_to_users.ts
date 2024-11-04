import {  Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('auto_day_finishing', 'boolean', (col) => col.defaultTo(true))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('auto_day_finishing').execute();
}
