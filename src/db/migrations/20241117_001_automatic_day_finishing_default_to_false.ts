import { Kysely } from 'kysely';

import { Database } from '#/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db
    .updateTable('users')
    .set({ auto_day_finishing: false })
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  // Do nothing, this was just to update the value of current users so behaviour does not suddenly change
  // The default value should still be true for new users.

  // Note: Since this, we've moved to doing data migrations with a seperate data_migrations table.
}
