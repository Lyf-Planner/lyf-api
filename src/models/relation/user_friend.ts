import { DbRelationFields, DbRelationObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { UserDbObject } from '../../api/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipRelations,
  UserFriendshipStatus
} from '../../api/schema/database/user_friendships';
import { PublicUser, UserFriend } from '../../api/schema/user';
import { UserRepository } from '../../repository/entity/user_repository';
import { UserFriendshipRepository } from '../../repository/relation/user_friendship_repository';
import { Logger } from '../../utils/logging';
import { ObjectUtils } from '../../utils/object';
import { UserEntity } from '../entity/user_entity';
import { BaseRelation } from './_base_relation';

export class UserFriendRelation extends BaseRelation<UserFriendshipDbObject, UserEntity> {
  protected logger: Logger = Logger.of(UserFriendRelation);

  protected relatedEntity: UserEntity;
  protected repository = new UserFriendshipRepository();

  static filter(object: any): UserFriendshipDbObject {
    const objectFilter: Required<UserFriendshipDbObject> = {
      user1_id_fk: object.user1_id_fk,
      user2_id_fk: object.user2_id_fk,
      created: object.created,
      last_updated: object.last_updated,
      status: object.status
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  constructor(id: ID, entity_id: ID, object?: UserFriendshipDbObject & UserDbObject) {
    super(id, entity_id);

    if (object) {
      this.base = UserFriendRelation.filter(object);
      this.relatedEntity = new UserEntity(entity_id, UserEntity.filter(object));
    } else {
      this.relatedEntity = new UserEntity(entity_id);
    }
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._id, this._entityId);
  }

  public async extract(): Promise<UserDbObject & UserFriendshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as UserDbObject,
      ...this.base!
    };
  }

  public async export(requestor?: string | undefined): Promise<UserFriend> {
    const relationFields: UserFriendshipRelations = {
      status: this.base!.status
    }

    return {
      ...await this.relatedEntity.export(this._id, false) as PublicUser,
      ...relationFields
    };
  }

  public async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserFriend>): Promise<void> {
    const relationFieldUpdates = UserFriendRelation.filter(changes);
  
    this.changes = relationFieldUpdates;
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };
  }

  public async save(): Promise<void> {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.updateRelation(this._id, this._entityId, this.changes);
    }
  }

  // --- HELPERS ---

  friends() {
    return this.base!.status === UserFriendshipStatus.Friends;
  }

  blocked() {
    return (
      this.base!.status === UserFriendshipStatus.BlockedByFirst ||
      this.base!.status === UserFriendshipStatus.BlockedBySecond ||
      this.base!.status === UserFriendshipStatus.MutualBlock
    );
  }

  blockedByMe() {
    const [id1, _id2] = this.sortedIds();
    if (id1 === this._id) {
      return this.base!.status === UserFriendshipStatus.BlockedByFirst;
    } else {
      return this.base!.status === UserFriendshipStatus.BlockedBySecond;
    }
  }

  blockedByEntity() {
    const [id1, _id2] = this.sortedIds();
    if (id1 === this._id) {
      return this.base!.status === UserFriendshipStatus.BlockedBySecond;
    } else {
      return this.base!.status === UserFriendshipStatus.BlockedByFirst;
    }
  }

  pendingOnFrom() {
    return (
      this.base!.user1_id_fk === this._id && this.base!.status === UserFriendshipStatus.PendingFirstAcceptance ||
      this.base!.user2_id_fk === this._id && this.base!.status === UserFriendshipStatus.PendingSecondAcceptance
    );
  }

  pendingOnTarget() {
    return (
      this.base!.user1_id_fk === this._id && this.base!.status === UserFriendshipStatus.PendingSecondAcceptance ||
      this.base!.user2_id_fk === this._id && this.base!.status === UserFriendshipStatus.PendingFirstAcceptance
    );
  }

  sortedIds() {
    return [this._entityId, this._id].sort();
  }
}
