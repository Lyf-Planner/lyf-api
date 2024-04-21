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

  async findItemsByUserId(user_id: string): Promise<ItemUserRelationshipDbObject[]> {
    return await this.db
      .selectFrom('items')
      .innerJoin('items_on_users', 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .execute();
  }

  async findUsersByItemId(item_id: string): Promise<ItemUserRelationshipDbObject[]> {
    return await this.db
      .selectFrom('users')
      .innerJoin('items_on_users', 'users.user_id', 'items_on_users.user_id_fk')
      .selectAll()
      .where('item_id_fk', '=', item_id)
      .execute();
  }
}
