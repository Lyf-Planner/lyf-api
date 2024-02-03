import { ID } from "../api/abstract";
import { User, UserDetails } from "../api/user";
import { Logger } from "../utils/logging";
import { RemoteObject } from "./abstract/remoteObject";
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
