import { sql, Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Delete existing duplicate data, then add the constraint
  // Step 1: Find the duplicate records based on `template_id` and `date`.
  const duplicates = await db
    .selectFrom('items')
    .select(['template_id', 'date'])
    .groupBy(['template_id', 'date'])
    .having(db.fn.count('id'), '>', 1)
    .execute();

  // Step 2: For each duplicate pair, delete only one record
  for (const duplicate of duplicates) {
    await db
      .deleteFrom('items')
      .where('template_id', '=', duplicate.template_id)
      .where('date', '=', duplicate.date)
      .orderBy('id')
      .limit(1)
      .execute();
  }

  // Add unique constraint
  await db.schema
  .alterTable('items')
  .addUniqueConstraint('template_instance_per_day', ['template_id', 'date'])
  .execute(); 
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
  .alterTable('items')
  .dropConstraint('template_instance_per_day')
  .execute();
}
