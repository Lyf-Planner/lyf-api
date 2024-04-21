import { ExternalUserSerialized, User, UserID, UserSerialized } from '../api/schema/user';
import { BaseModel } from './base_model';

export class UserModel extends BaseModel<User> {
  constructor(entity: User, requestor: UserID) {
    super(entity, requestor);
  }

  public isPrivate() {
    return this.entity.private;
  }

  public requestedBySelf() {
    return this.requestedBy === this.entity.user_id;
  }

  public getPushTokens() {
    return this.entity.expo_tokens;
  }

  public export(): UserSerialized | ExternalUserSerialized {
    if (this.requestedBy !== this.entity.user_id) {
      return this.exportToOtherUser();
    } else {
      return this.stripSensitiveFields();
    }
  }

  private exportToOtherUser(): ExternalUserSerialized {
    return {
      created: this.entity.created,
      last_updated: this.entity.last_updated,
      user_id: this.entity.user_id,
      tz: this.entity.tz,
      display_name: this.entity.display_name,
      pfp_url: this.entity.pfp_url,
      friendships: this.entity.friendships
    };
  }

  private stripSensitiveFields() {
    const { pass_hash, expo_tokens, ...exported } = this.entity;
    return exported;
  }
}
