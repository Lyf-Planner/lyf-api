import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db
    .updateTable('users')
    .set({ auto_day_finishing: false })
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Do nothing, this was just to update the value of current users so behaviour does not suddenly change
  // The default value should still be true for new users.
}
