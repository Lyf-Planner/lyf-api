import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_friendships')
    .addColumn('created', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('last_updated', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('user1_id_fk', 'uuid', (col) => col.notNull().references('users.user_id'))
    .addColumn('user2_id_fk', 'uuid', (col) => col.notNull().references('users.user_id'))
    .addColumn('status', 'text', (col) => col.notNull())
    .addPrimaryKeyConstraint('pk_user_friendships', ['user1_id_fk', 'user2_id_fk'])
    .addCheckConstraint('user_id_order', sql`user1_id_fk < user2_id_fk`)
    .addCheckConstraint(
      'check_status',
      sql`status IN (\'Pending First\', \'Pending Second\', \'Friends'\, \'Blocked By First\', \'Blocked By Second\', \'Mutually Blocked\')`
    )
    .execute();

  await db.schema
    .createIndex('user1_index')
    .on('user_friendships')
    .column('user1_id_fk')
    .execute();
  await db.schema
    .createIndex('user2_index')
    .on('user_friendships')
    .column('user2_id_fk')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_friendships').execute();
}
