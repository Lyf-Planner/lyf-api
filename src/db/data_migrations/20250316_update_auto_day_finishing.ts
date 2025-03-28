import { Kysely } from 'kysely';

import { Database } from '../../../schema/database';
import { LyfError } from '../../utils/lyf_error';

export async function up(db: Kysely<Database>): Promise<void> {
  await db
    .updateTable('users')
    .set({ auto_day_finishing: true })
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  console.error('cannot roll back data migrations');
  throw new LyfError('Irreversible Migration!', 500);
}
