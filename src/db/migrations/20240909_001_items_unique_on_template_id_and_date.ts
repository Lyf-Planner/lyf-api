import { Kysely } from 'kysely';

import { Database } from '../../../schema/database';

export async function up(db: Kysely<Database>): Promise<void> {
  // Delete existing duplicate data, then add the constraint
  // Step 1: Find the duplicate records based on `template_id` and `date`.
  const duplicates = await db
    .selectFrom('items')
    .select(['template_id', 'date'])
    .groupBy(['template_id', 'date'])
    .having(db.fn.count('id'), '>', 1)
    .execute();

  // Step 2: For each duplicate pair, find and delete only one record using a subquery
  for (const duplicate of duplicates) {
    const subquery = db
      .selectFrom('items')
      .select('id')
      .where('template_id', '=', duplicate.template_id)
      .where('date', '=', duplicate.date)
      .orderBy('id')
      .limit(1);

    await db
      .deleteFrom('items_on_users')
      .where('item_id_fk', '=', subquery)
      .execute();

    await db
      .deleteFrom('items')
      .where('id', '=', subquery)
      .execute();
  }

  // Add unique constraint
  await db.schema
    .alterTable('items')
    .addUniqueConstraint('template_instance_per_day', ['template_id', 'date'])
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('items')
    .dropConstraint('template_instance_per_day')
    .execute();
}
