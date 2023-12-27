import { ID } from "../api/abstract";
import { User, UserDetails } from "../api/user";
import db from "../repository/dbAccess";
import { Logger } from "../utils/logging";
import { RemoteObject } from "./abstract/remoteObject";
import { TimeOperations } from "./abstract/timeOperations";
import { UserOperations } from "./userOperations";

export class UserModel extends RemoteObject<User> {
  // If user is accessed by another, should only be able to view details!
  private detailsAccessOnly: boolean;
  private logger = Logger.of(UserModel);

  constructor(user: User, from_db: boolean, details_access_only: boolean) {
    super(db.usersCollection(), user, from_db);
    this.detailsAccessOnly = details_access_only;
  }

  public getUser(): UserDetails | User {
    if (this.detailsAccessOnly)
      return UserOperations.extractUserDetails(this.content);
    else return this.content;
  }

  // Get the user, but hide sensitive fields
  public export() {
    // Needs validator
    if (this.detailsAccessOnly) return this.getUser();
    else {
      var { pass_hash, notification_token_hash, ...exported } = this.content;
      return exported;
    }
  }

  public async safeUpdate(proposed: User, user_id: ID) {
    // 1. User can only update their own
    this.throwIfUpdatingOtherUser(proposed, user_id);

    // 2. Cannot modify social fields on this endpoint
    this.throwIfModifiedSensitiveFields(proposed, user_id);

    // 3. No one should modify time fields
    TimeOperations.throwIfTimeFieldsModified(this.content, proposed, user_id);

    // Checks passed!
    this.logger.info(`User ${user_id} safely updated note ${this.id}`);
    this.content = proposed;
    this.commit();
  }

  private throwIfUpdatingOtherUser(proposed: User, user_id: ID) {
    if (!(proposed.id === user_id && user_id === this.id)) {
      this.logger.error(
        `User ${user_id} tried to modify other user ${this.id}`
      );
      throw new Error(`User does not have permission to modify another user`);
    }
  }

  private throwIfModifiedSensitiveFields(proposed: User, user_id: ID) {
    var oldFields = JSON.stringify(
      UserOperations.extractSensitiveFields(this.content)
    );
    var newFields = JSON.stringify(
      UserOperations.extractSensitiveFields(proposed)
    );

    if (oldFields !== newFields) {
      this.logger.error(
        `User ${user_id} tried to modify sensitive fields on ${this.id}`
      );
      throw new Error(
        `Users cannot modify sensitive fields such as friends or premium access on this endpoint`
      );
    }
  }
}
