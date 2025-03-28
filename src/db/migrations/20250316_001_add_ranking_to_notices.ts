import { Kysely } from 'kysely';

import { Database } from '../../../schema/database';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('notices')
    .addColumn('rank', 'integer')
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('notices').dropColumn('rank').execute();
}
