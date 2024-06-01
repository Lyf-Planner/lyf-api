import { DbRelationFields, DbRelationObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { ItemDbObject } from '../../api/schema/database/items';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../api/schema/database/items_on_users';
import { Item } from '../../api/schema/items';
import { UserRelatedItem } from '../../api/schema/user';
import { ItemRepository } from '../../repository/entity/item_repository';
import { ItemUserRepository } from '../../repository/relation/item_user_repository';
import { Logger } from '../../utils/logging';
import { ItemEntity } from '../entity/item_entity';
import { BaseRelation } from './_base_relation';

export class UserItemRelation extends BaseRelation<ItemUserRelationshipDbObject, ItemEntity> {
  protected logger: Logger = Logger.of(UserItemRelation);

  protected relatedEntity: ItemEntity;
  protected repository = new ItemUserRepository();

  static filter(object: any): ItemUserRelationshipDbObject {
    return {
      created: object.created,
      last_updated: object.last_updated,
      item_id_fk: object.item_id_fk,
      user_id_fk: object.user_id_fk,
      invite_pending: object.invite_pending,
      permission: object.permission,
      sorting_rank: object.sorting_rank,
      show_in_upcoming: object.show_in_upcoming,
      notification_mins_before: object.notification_mins_before
    };
  }

  constructor(id: ID, entity_id: ID, object?: ItemUserRelationshipDbObject & ItemDbObject) {
    super(id, entity_id);
    this.base = UserItemRelation.filter(object);
    this.relatedEntity = new ItemEntity(entity_id, ItemEntity.filter(object));
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._entityId, this._id);
  }

  public async extract(): Promise<ItemDbObject & ItemUserRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as ItemDbObject,
      ...this.base!
    };
  }

  public async export(requestor?: string | undefined): Promise<UserRelatedItem> {
    // We want the users on the item in addition to just the item
    await this.relatedEntity.fetchRelations("users");

    return {
      // No need to add the requestor
      // The permission is implied by the relationship existing at all
      ...await this.relatedEntity.export(undefined, true) as Item,
      ...UserItemRelation.filter(this.base!)
    };
  }

  public async load(relations: object): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._entityId, this._id);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserRelatedItem>): Promise<void> {
    const relationFieldUpdates = UserItemRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._entityId, this._id, this.base!);
  }
}
