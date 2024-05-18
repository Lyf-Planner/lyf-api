import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { UserDbObject } from '../../../api/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipRelations
} from '../../../api/schema/database/user_friendships';
import { PublicUser, UserFriend } from '../../../api/schema/user';
import { UserRepository } from '../../../repository/entity/user_repository';
import { UserFriendshipRepository } from '../../../repository/relation/user_friendship_repository';
import { Logger } from '../../../utils/logging';
import { BaseEntity } from '../entity/base_entity';
import { UserEntity } from '../entity/user_entity';
import { BaseRelation } from './base_relation';

export class UserFriendRelation extends BaseRelation<UserFriendshipDbObject, UserDbObject> {
  protected logger: Logger = Logger.of(UserFriendRelation);

  protected relatedEntity: UserEntity;
  protected repository = new UserFriendshipRepository();

  constructor(id: ID, entity_id: ID) {
    super(id, entity_id);
    this.relatedEntity = new UserEntity(entity_id);
  }

  static filter(object: any): UserFriendshipRelations {
    return {
      status: object.status
    }
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._id, this._entityId);
  }

  public async extract(): Promise<UserDbObject & UserFriendshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as UserDbObject,
      ...this.base!
    }
  }

  public async export(requestor?: string | undefined): Promise<UserFriend> {
    return {
      ...await this.relatedEntity.export("", false) as PublicUser,
      ...UserFriendRelation.filter(this.base!)
    }
  }

  public async load(relations: object): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserFriend>): Promise<void> {
    const relationFieldUpdates = UserFriendRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    }
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._id, this._entityId, this.base!);
  }
}
