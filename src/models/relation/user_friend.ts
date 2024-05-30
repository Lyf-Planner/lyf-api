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
import { UserEntity } from '../entity/user_entity';
import { BaseRelation } from './_base_relation';

export class UserFriendRelation extends BaseRelation<UserFriendshipDbObject, UserEntity> {
  protected logger: Logger = Logger.of(UserFriendRelation);

  protected relatedEntity: UserEntity;
  protected repository = new UserFriendshipRepository();

  static filter(object: any): UserFriendshipRelations {
    return {
      status: object.status
    };
  }

  constructor(id: ID, entity_id: ID) {
    super(id, entity_id);
    this.relatedEntity = new UserEntity(entity_id);
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
    return {
      ...await this.relatedEntity.export('', false) as PublicUser,
      ...UserFriendRelation.filter(this.base!)
    };
  }

  public async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserFriend>): Promise<void> {
    const relationFieldUpdates = UserFriendRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._id, this._entityId, this.base!);
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
