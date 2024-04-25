import { UserDbObject, UserID, UserSensitiveFields } from '../../api/schema/database/user';
import {
  PublicUser,
  User,
  UserFriend,
  UserRelatedItem,
  UserRelatedNote,
  UserRelations
} from '../../api/schema/user';
import { Logger } from '../../utils/logging';
import { BaseEntity } from './base_entity';

export class UserEntity extends BaseEntity<User> {
  private logger = Logger.of(UserEntity);

  constructor(entity: User, requested_by: UserID) {
    super(entity, requested_by);
  }

  public id() {
    return this.entity.user_id
  }

  protected parse(dbObject: UserDbObject) {
    const initialRelations: UserRelations = {
      friends: [] as UserFriend[],
      items: [] as UserRelatedItem[],
      notes: [] as UserRelatedNote[]
    };

    return {
      ...dbObject,
      ...initialRelations
    };
  }

  public validate() {
    if (!this.requestedBySelf() && this.isPrivate()) {
      this.logger.warn(
        `User ${this.entity.user_id} was queried by ${this.requestedBy} but hidden due to privacy`
      );
      throw new Error(`User ${this.entity.user_id} does not exist`); // Shhhh
    }
  }

  public includeRelations(relations: Partial<UserRelations>) {
    this.update(relations);
  }

  public export() {
    if (this.requestedBySelf()) {
      return this.stripSensitiveFields();
    } else {
      return this.exportAsPublicUser();
    }
  }

  // --- Helpers ---

  public requestedBySelf() {
    return this.entity.user_id === this.requestedBy;
  }

  public isPrivate() {
    return this.entity.private;
  }

  public name() {
    return this.entity.display_name || this.entity.user_id;
  }

  public getSensitive(): UserSensitiveFields {
    if (this.requestedBySelf()) {
      throw new Error('User tried to retrieve sensitive fields on another user');
    }

    return { expo_tokens: this.entity.expo_tokens, pass_hash: this.entity.pass_hash };
  }

  private exportAsPublicUser(): PublicUser {
    return {
      created: this.entity.created,
      last_updated: this.entity.last_updated,
      user_id: this.entity.user_id,
      display_name: this.entity.display_name,
      pfp_url: this.entity.pfp_url,
      friends: this.entity.friends
    };
  }

  private stripSensitiveFields() {
    const { pass_hash, expo_tokens, ...exported } = this.entity;
    return exported;
  }
}
