import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { ItemUserPrimaryKey, ItemUserRelationshipDbObject } from '../api/schema/items_on_users';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'items_on_users';

export class ItemUserRepository extends BaseRepository<ItemUserRelationshipDbObject> {
  constructor(db: Kysely<Database>) {
    super(db, TABLE_NAME);
  }

  async findByCompositeId({
    item_id_fk,
    user_id_fk
  }: ItemUserPrimaryKey): Promise<ItemUserRelationshipDbObject | undefined> {
    return this.db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where('item_id_fk', '=', item_id_fk)
      .where('user_id_fk', '=', user_id_fk)
      .executeTakeFirst();
  }

  async findByUserId(user_id: string): Promise<ItemUserRelationshipDbObject[]> {
    return this.db.selectFrom(TABLE_NAME).selectAll().where('user_id_fk', '=', user_id).execute();
  }

  async findByItemId(item_id: string): Promise<ItemUserRelationshipDbObject[]> {
    return this.db.selectFrom(TABLE_NAME).selectAll().where('item_id_fk', '=', item_id).execute();
  }
}
