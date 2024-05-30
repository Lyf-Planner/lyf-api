import { DbRelationFields, DbRelationObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { ItemUserRelations, ItemUserRelationshipDbObject } from '../../api/schema/database/items_on_users';
import { UserDbObject, UserPublicFields } from '../../api/schema/database/user';
import { ItemRelatedUser } from '../../api/schema/items';
import { ItemUserRepository } from '../../repository/relation/item_user_repository';
import { Logger } from '../../utils/logging';
import { ObjectUtils } from '../../utils/object';
import { UserEntity } from '../entity/user_entity';
import { SocialRelation } from './_social_relation';

export class ItemUserRelation extends SocialRelation<ItemUserRelationshipDbObject, UserEntity> {
  protected logger: Logger = Logger.of(ItemUserRelation);

  // This should be readonly, updates should be done through the Entity directly
  protected relatedEntity: UserEntity;
  protected repository = new ItemUserRepository();

  static filter(object: any): ItemUserRelations {
    return {
      invite_pending: object.invite_pending,
      permission: object.permission,
      sorting_rank: object.sorting_rank,
      show_in_upcoming: object.show_in_upcoming,
      notification_mins_before: object.notification_mins_before
    };
  }

  constructor(id: ID, entity_id: ID) {
    super(id, entity_id);
    this.relatedEntity = new UserEntity(entity_id);
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
    return {
      ...await this.relatedEntity.export('', false) as UserPublicFields,
      ...ItemUserRelation.filter(this.base!)
    };
  }

  public async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<ItemRelatedUser>): Promise<void> {
    const relationFieldUpdates = ItemUserRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._entityId, this._id, this.base!);
  }

  public notificationMinsBefore() {
    return this.base!.notification_mins_before;
  }
}
