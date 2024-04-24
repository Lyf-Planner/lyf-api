import { UserID, UserPublicFields, UserSensitiveFields } from '../api/schema/database/user';
import { User, UserRelations } from '../api/schema/user';
import { ItemUserRepository } from '../repository/item_user_repository';
import { Logger } from '../utils/logging';
import { BaseModel } from './base_model';

export class UserModel extends BaseModel<User> {
  private logger = Logger.of(UserModel);

  constructor(entity: User, requested_by: UserID) {
    super(entity, requested_by);
  }

  public validate() {
    if (!this.requestedBySelf() && this.isPrivate()) {
      this.logger.warn(
        `User ${this.entity.user_id} was queried by ${this.requestedBy} but hidden due to privacy`
      );
      throw new Error(`User ${this.entity.user_id} does not exist`); // Shhhh
    }
  }

  public export() {
    if (this.requestedBySelf()) {
      return this.stripSensitiveFields();
    } else {
      return this.exportToOtherUser();
    }
  }

  public requestedBySelf() {
    return this.entity.user_id === this.requestedBy;
  }

  public isPrivate() {
    return this.entity.private;
  }

  // public async loadRelations(): Promise<UserRelations> {
  //   const items = new ItemUserRepository().findItemsByUserId()
  // }

  public getSensitive(): UserSensitiveFields {
    if (this.requestedBySelf()) {
      throw new Error('User tried to retrieve sensitive fields on another user');
    }

    return { expo_tokens: this.entity.expo_tokens, pass_hash: this.entity.pass_hash };
  }

  private exportToOtherUser(): UserPublicFields {
    return {
      created: this.entity.created,
      last_updated: this.entity.last_updated,
      user_id: this.entity.user_id,
      display_name: this.entity.display_name,
      pfp_url: this.entity.pfp_url
    };
  }

  private stripSensitiveFields() {
    const { pass_hash, expo_tokens, ...exported } = this.entity;
    return exported;
  }
}
