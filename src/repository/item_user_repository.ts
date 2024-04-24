import { Item } from '../api/schema/items';
import { ItemUserPrimaryKey, ItemUserRelationshipDbObject } from '../api/schema/database/items_on_users';
import { ItemRelatedUser } from '../api/schema/items';
import { UserRelatedItem } from '../api/schema/user';
import { User } from '../api/schema/user';
import { BaseRepository } from './base_repository';
import { ID } from '../api/mongo_schema/abstract';
import { UserDbObject, UserID } from '../api/schema/database/user';
import { ItemDbObject } from '../api/schema/database/items';

const TABLE_NAME = 'items_on_users';

export class ItemUserRepository extends BaseRepository<ItemUserRelationshipDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findItemRelatedUsers(item_id: ID): Promise<(UserDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('users')
      .innerJoin('items_on_users', 'users.user_id', 'items_on_users.user_id_fk')
      .selectAll()
      .where('item_id_fk', '=', item_id)
      .execute();

    return result;
  }

  async findUserRelatedItems(user_id: UserID): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin('items_on_users', 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .execute();

    return result;
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
}
