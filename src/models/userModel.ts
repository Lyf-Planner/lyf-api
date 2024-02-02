import { ID } from "../api/abstract";
import { User, UserDetails } from "../api/user";
import { Logger } from "../utils/logging";
import { RemoteObject } from "./abstract/remoteObject";
import { TimeOperations } from "./abstract/timeOperations";
import { UserOperations } from "./userOperations";
import notificationManager from "../notifications/notificationManager";
import db from "../repository/dbAccess";
import { updateMeBody } from "../rest/validators/userValidators";

export class UserModel extends RemoteObject<User> {
  // If user is accessed by another, should only be able to view details!
  private requestedBySelf: boolean;
  private logger = Logger.of(UserModel);

  constructor(user: User, from_db: boolean, requestedBySelf: boolean) {
    super(db.usersCollection(), user, from_db);
    this.requestedBySelf = requestedBySelf;
  }

  public getUser(): UserDetails | User {
    if (!this.requestedBySelf)
      return UserOperations.extractUserDetails(this.content);
    else return this.content;
  }

  public async inviteUserToItem(item_id: ID) {
    this.content.timetable.invited_items
      ? this.content.timetable.invited_items.push(item_id)
      : (this.content.timetable.invited_items = [item_id]);

    await this.commit();
  }

  public async acceptItemInvite(item_id: ID) {
    // Remove from invites
    const i = this.content.timetable.invited_items?.findIndex(
      (x) => x === item_id
    )!;
    this.content.timetable.invited_items?.splice(i, 1);

    // Add to items
    this.content.timetable.items.push({ id: item_id });
    await this.commit();
  }

  // Get the user, but hide sensitive fields
  public export() {
    // Needs validator
    if (!this.requestedBySelf) return this.getUser();
    else {
      const { pass_hash, expo_tokens, ...exported } = this.content;
      return exported;
    }
  }

  public async updateSelf(proposed: updateMeBody) {
    if (!this.requestedBySelf) {
      throw new Error("Cannot update someone elses details!");
    }

    // PRE-COMMIT (update other items like notifications)
    const incomingChange = { ...this.content, ...proposed } as User;
    this.checkDailyNotifications(incomingChange);
    this.checkTimezoneChange(incomingChange);

    this.logger.debug(`User ${this.id} safely updated their own data`);
    this.content = incomingChange;
    await this.commit();
  }

  // Soon deprecated
  public async safeUpdate(proposed: User, user_id: ID) {
    // SAFETY CHECKS
    // 1. User can only update their own
    this.throwIfUpdatingOtherUser(proposed, user_id);

    // 2. Cannot modify social fields on this endpoint
    this.throwIfModifiedSensitiveFields(proposed, user_id);

    // 3. No one should modify time fields
    TimeOperations.throwIfTimeFieldsModified(this.content, proposed, user_id);
    // Checks passed!

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(proposed);
    this.checkTimezoneChange(proposed);

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

  private checkTimezoneChange(proposed: User) {
    if (this.content.timezone && proposed.timezone !== this.content.timezone) {
      notificationManager.handleUserTzChange(proposed);
    }
  }
}
