import { ID } from "../api/abstract";
import { User, UserDetails } from "../api/user";
import notificationManager from "../notifications/notificationManager";
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
      var { pass_hash, expo_tokens, ...exported } = this.content;
      return exported;
    }
  }

  public async safeUpdate(proposed: User, user_id: ID) {
    // SAFETY CHECKS
    // 1. User can only update their own
    this.throwIfUpdatingOtherUser(proposed, user_id);

    // 2. Cannot modify social fields on this endpoint
    this.throwIfModifiedSensitiveFields(proposed, user_id);

    // 3. No one should modify time fields
    TimeOperations.throwIfTimeFieldsModified(this.content, proposed, user_id);

    // Checks passed!
    // PRE-COMMIT
    this.checkDailyNotifications(proposed);

    this.logger.debug(`User ${user_id} safely updated user ${this.id}`);
    this.content = proposed;
    await this.commit();
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

  private checkDailyNotifications(proposed: User) {
    var oldEnabled = this.content.premium?.notifications?.daily_notifications;
    var newEnabled = proposed.premium?.notifications?.daily_notifications;

    var oldTime = this.content.premium?.notifications?.daily_notification_time;
    var newTime = proposed.premium?.notifications?.daily_notification_time;

    if (!oldEnabled && newEnabled) {
      notificationManager.setDailyNotifications({ ...proposed });
    } else if (oldEnabled && newEnabled && oldTime !== newTime) {
      notificationManager.updateDailyNotifications({ ...proposed });
    } else if (oldEnabled && !newEnabled) {
      notificationManager.removeDailyNotifications(proposed.id);
    }
  }
}
