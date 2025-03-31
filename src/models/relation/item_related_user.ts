import { ID } from '#/database/abstract';
import { ItemUserRelations, ItemUserRelationshipDbObject } from '#/database/items_on_users';
import { UserDbObject, UserPublicFields } from '#/database/user';
import { ItemRelatedUser } from '#/items';
import { UserEntity } from '@/models/entity/user_entity';
import { SocialRelation } from '@/models/relation/_social_relation';
import { ItemUserRepository } from '@/repository/relation/item_user_repository';
import { Logger } from '@/utils/logging';
import { ObjectUtils } from '@/utils/object';
import { Includes } from '@/utils/types';

export class ItemUserRelation extends SocialRelation<ItemUserRelationshipDbObject, UserEntity> {
  protected logger: Logger = Logger.of(ItemUserRelation.name);

  // This should be readonly, updates should be done through the Entity directly
  protected relatedEntity: UserEntity;
  protected repository = new ItemUserRepository();

  static filter(object: Includes<ItemUserRelationshipDbObject>): ItemUserRelationshipDbObject {
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
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  constructor(id: ID, entity_id: ID, object?: ItemUserRelationshipDbObject & UserDbObject) {
    super(id, entity_id);

    if (object) {
      this.base = ItemUserRelation.filter(object);
      this.relatedEntity = new UserEntity(entity_id, UserEntity.filter(object));
    } else {
      this.relatedEntity = new UserEntity(entity_id);
    }
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._id, this._entityId);
  }

  public async extract(): Promise<UserDbObject & ItemUserRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as UserDbObject,
      ...this.base!
    };
  }

  public async export(requestor?: string | undefined): Promise<ItemRelatedUser> {
    const relationFields: ItemUserRelations = {
      invite_pending: this.base!.invite_pending,
      permission: this.base!.permission,
      sorting_rank: this.base!.sorting_rank,
      show_in_upcoming: this.base!.show_in_upcoming,
      notification_mins: this.base!.notification_mins
    }

    return {
      ...await this.relatedEntity.export('', false) as UserPublicFields,
      ...relationFields
    };
  }

  public async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<ItemRelatedUser>): Promise<void> {
    const updatedBase = ItemUserRelation.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  public async save(): Promise<void> {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.updateRelation(this._id, this._entityId, this.changes);
    }
  }

  public notificationMinsBefore() {
    return this.base!.notification_mins;
  }
}
