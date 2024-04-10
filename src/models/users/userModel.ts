import { ID, Time } from '../../api/mongo_schema/abstract';
import { User, UserDetails } from '../../api/mongo_schema/user';
import { Logger } from '../../utils/logging';
import { RemoteObject } from '../abstract/remoteObject';
import { UserOperations } from './userOperations';
import notificationManager from '../notifications/notificationManager';
import db from '../../repository/mongoDb';

export class UserModel extends RemoteObject<User> {
  // If user is accessed by another, should only be able to view details!
  protected requestedBySelf: boolean;
  protected logger = Logger.of(UserModel);

  constructor(user: User, from_db: boolean, requestedBySelf: boolean) {
    super(db.usersCollection(), user, from_db);
    this.requestedBySelf = requestedBySelf;
  }

  public getUser(asSelf = true): (UserDetails & Time) | User {
    if (!this.requestedBySelf || !asSelf)
      return UserOperations.extractUserDetails(this.content);
    else return this.content;
  }

  public name() {
    return this.content.details?.name || this.content.id;
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

  public async updateSelf(proposed: any) {
    if (!this.requestedBySelf) {
      throw new Error('Cannot update someone elses details!');
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
      notificationManager.handleUserTzChange(proposed, this.content.timezone);
    }
  }

  protected enforceRequestedBySelf(
    error_message: string,
    logger_message?: string
  ) {
    if (!this.requestedBySelf) {
      this.logger.error(logger_message || error_message);
      throw new Error(error_message);
    }
  }
}
