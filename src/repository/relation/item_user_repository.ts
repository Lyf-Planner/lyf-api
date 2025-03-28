import { ItemDbObject } from '../../../schema/database/items';
import { ItemUserRelationshipDbObject } from '../../../schema/database/items_on_users';
import { UserDbObject } from '../../../schema/database/user';
import { ID } from '../../../schema/mongo_schema/abstract';
import { daysOfWeek } from '../../utils/dates';

import { RelationRepository } from './_relation_repository';

const TABLE_NAME = 'items_on_users';

export class ItemUserRepository extends RelationRepository<ItemUserRelationshipDbObject> {
  protected readonly pk_a = 'item_id_fk';
  protected readonly pk_b = 'user_id_fk';

  constructor() {
    super(TABLE_NAME);
  }

  public async deleteRelation(item_id: ID, user_id: ID) {
    await this.db
      .deleteFrom(this.table_name)
      .where(this.pk_a, '=', item_id)
      .where(this.pk_b, '=', user_id)
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

  // Items filtered by date or day
  async findUserFilteredItems(
    user_id: ID,
    start_date: string,
    end_date: string,
    days: string[]
  ): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin(TABLE_NAME, 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .where((eb) => eb.or([eb.between('date', start_date, end_date), eb('day', 'in', days)]))
      .execute();

    return result;
  }

  // Items filtered by future
  async findUserFutureItems(
    user_id: ID,
    start_date: string
  ): Promise<(ItemDbObject & ItemUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('items')
      .innerJoin(TABLE_NAME, 'items.id', 'items_on_users.item_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .where((eb) => eb.or([eb('date', '>=', start_date), eb('date', 'is', null), eb('day', 'in', daysOfWeek)]))
      .execute();

    return result;
  }

  async updateRelation(
    item_id_fk: ID,
    user_id_fk: ID,
    changes: Partial<ItemUserRelationshipDbObject>
  ) {
    return await this.db
      .updateTable(TABLE_NAME)
      .where((eb) => eb.and([
        eb('item_id_fk', '=', item_id_fk),
        eb('user_id_fk', '=', user_id_fk)
      ]))
      .set(changes)
      .returningAll()
      .execute();
  }
}
