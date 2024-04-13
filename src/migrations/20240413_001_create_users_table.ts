import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('user_id', 'uuid', (col) => col.primaryKey())
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('pass_hash', 'text', (col) => col.notNull())
    .addColumn('private', 'boolean', (col) => col.notNull())
    .addColumn('tz', 'text', (col) => col.notNull())
    .addColumn('expo_tokens', sql`text[]`, (col) => col.notNull())
    .addColumn('display_name', 'text')
    .addColumn('pfp_url', 'text')
    .addColumn('daily_notifications', 'boolean')
    .addColumn('daily_notification_time', 'time')
    .addColumn('persistent_daily_notification', 'boolean')
    .addColumn('event_notifications_enabled', 'boolean')
    .addColumn('event_notification_minutes_before', 'integer')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
