import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users').addColumn('first_day', 'date').execute();
  await db.schema
    .alterTable('users')
    .alterColumn('daily_notification_time', (col) => col.setDataType('varchar(5)'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('first_day').execute();
}
