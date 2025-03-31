
import { ID } from '#/database/abstract';
import { ItemDbObject } from '#/database/items';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '#/database/items_on_users';
import { Item } from '#/items';
import { UserRelatedItem } from '#/user';
import { ItemEntity } from '@/models/entity/item_entity';
import { BaseRelation } from '@/models/relation/_base_relation';
import { ItemUserRepository } from '@/repository/relation/item_user_repository';
import { Logger } from '@/utils/logging';
import { ObjectUtils } from '@/utils/object';
import { Extension } from '@/utils/types';

export class UserItemRelation extends BaseRelation<ItemUserRelationshipDbObject, ItemEntity> {
  protected logger: Logger = Logger.of(UserItemRelation.name);

  protected relatedEntity: ItemEntity;
  protected repository = new ItemUserRepository();

  static filter(object: Extension<ItemUserRelationshipDbObject>): ItemUserRelationshipDbObject {
    const objectFilter: Required<ItemUserRelationshipDbObject> = {
      created: object.created,
      last_updated: object.last_updated,
      item_id_fk: object.item_id_fk,
      user_id_fk: object.user_id_fk,
      invite_pending: object.invite_pending,
      permission: object.permission,
      sorting_rank: object.sorting_rank,
      show_in_upcoming: object.show_in_upcoming,
      notification_mins: object.notification_mins
    }

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  constructor(id: ID, entity_id: ID, object?: ItemUserRelationshipDbObject & ItemDbObject) {
    super(id, entity_id);

    if (object) {
      this.base = UserItemRelation.filter(object);
      this.relatedEntity = new ItemEntity(entity_id, ItemEntity.filter(object));
    } else {
      this.relatedEntity = new ItemEntity(entity_id);
    }
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
    const relationFields: ItemUserRelations = {
      invite_pending: this.base!.invite_pending,
      permission: this.base!.permission,
      sorting_rank: this.base!.sorting_rank,
      show_in_upcoming: this.base!.show_in_upcoming,
      notification_mins: this.base!.notification_mins
    }

    return {
      // No need to add the requestor
      // The permission is implied by the relationship existing at all
      ...await this.relatedEntity.export(undefined, true) as Item,
      ...relationFields
    };
  }

  public async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._entityId, this._id);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserRelatedItem>): Promise<void> {
    const updatedBase = UserItemRelation.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;

    const entityUpdates = ItemEntity.filter({
      ...await this.relatedEntity.extract() as ItemDbObject,
      ...changes
    });
    this.relatedEntity.update(entityUpdates);
  }

  public async save(): Promise<void> {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.updateRelation(this._entityId, this._id, this.changes);
    }
  }

  public permission() {
    return this.base?.permission;
  }
}
