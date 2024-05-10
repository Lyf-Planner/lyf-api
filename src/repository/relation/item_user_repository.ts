import { ID } from '../../api/mongo_schema/abstract';
import { ItemDbObject } from '../../api/schema/database/items';
import { ItemUserRelationshipDbObject } from '../../api/schema/database/items_on_users';
import { UserDbObject } from '../../api/schema/database/user';
import { RelationRepository } from './_relation_repository';

const TABLE_NAME = 'items_on_users';

export class ItemUserRepository extends RelationRepository<ItemUserRelationshipDbObject> {
  protected readonly pk_a = 'item_id_fk';
  protected readonly pk_b = 'user_id_fk';

  constructor() {
    super(TABLE_NAME);
  }

  async updateRelation(
    user_id_fk: ID,
    item_id_fk: ID,
    changes: Partial<ItemUserRelationshipDbObject>
  ) {
    return await this.db
      .updateTable(TABLE_NAME)
      .set(changes)
      .where('user_id_fk', '=', user_id_fk)
      .where('item_id_fk', '=', item_id_fk)
      .returningAll()
      .execute();
  }

  async findItemRelatedUsers(
    item_id: ID
  ): Promise<(UserDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('users')
      .innerJoin(TABLE_NAME, 'users.id', 'items_on_users.user_id_fk')
      .selectAll()
      .where('item_id_fk', '=', item_id)
      .execute();

    return result;
  }

  async findUserRelatedItems(
    user_id: ID
  ): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin(TABLE_NAME, 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .execute();

    return result;
  }

  async findUserRelatedItemsOnDate(
    user_id: ID,
    date: string
  ): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin(TABLE_NAME, 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .where('date', '=', date)
      .execute();

    return result;
  }

  async findUserRelatedItemsOnDay(
    user_id: ID,
    day: string
  ): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin(TABLE_NAME, 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .where('day', '=', day)
      .execute();

    return result;
  }

  async findUserRelatedItemsOnDateOrDay(
    user_id: ID,
    date: string,
    day: string
  ): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin(TABLE_NAME, 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .where((eb) => eb.or([eb('date', '=', date), eb('day', '=', day)]))
      .execute();

    return result;
  }
}
