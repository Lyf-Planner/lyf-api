import { Kysely } from 'kysely';

import { Database } from '#/database';
import { LyfError } from '@/utils/lyf_error';

export async function up(db: Kysely<Database>): Promise<void> {
  await db
    .updateTable('users')
    .set({ auto_day_finishing: true })
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  console.error('cannot roll back this data migration');
  throw new LyfError('Irreversible Migration!', 500);
}
