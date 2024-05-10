import { ItemStatus, ListItem } from '../../../api/mongo_schema/list';
import { Permission } from '../../../api/mongo_schema/social';
import { updateItemBody } from '../../../controller/validators/itemValidators';
import db from '../../../repository/db/mongo/mongo_db';
import { SocialItemNotifications } from '../../../services/notifications/socialItemNotificationService';
import { Logger } from '../../../utils/logging';
import notificationManager from '../../services/notifications/notificationManager';
import { RestrictedRemoteObject } from '../abstract/restrictedRemoteObject';
import { UserModel } from '../users/userModel';
import { UserOperations } from '../users/userOperations';

export class ItemModel extends RestrictedRemoteObject<ListItem> {
  private logger = Logger.of(ItemModel);

  constructor(item: ListItem, from_db: boolean = false, requested_by: string) {
    super(db.itemsCollection(), item, from_db, requested_by);
  }

  public export() {
    var { ...exported } = this.content;
    return exported;
  }

  public async delete() {
    if (this.content.notifications) {
      for (const notif of this.content.notifications) {
        notificationManager.removeEventNotification(this.content, notif.user_id);
      }
    }
    await this.deleteFromDb();
  }

  // Update and throw if there are any permissions violations
  public async safeUpdate(proposed: updateItemBody, user_id: string): Promise<boolean> {
    // Run through permissions checks for updates
    var perm = this.getUserPermission(user_id);
    var fromUser = await UserOperations.retrieveForUser(user_id, user_id);

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer or Invited
    this.throwIfReadOnly(perm);

    // 2. Should not update anyone elses notifications (this is the only restriction within modifying metadata)
    this.throwIfModifiedOtherNotifications(fromUser, proposed);

    // Checks passed

    const newItem = { ...this.content, ...proposed };
    // PRE-COMMIT TASKS
    // 1. Action any notification updates
    this.handleNotificationChanges({ ...newItem });

    // 2. Handle any time changes
    this.handleTimeChanges({ ...newItem }, fromUser);

    // 3. Handle any status changes
    this.handleStatusChanges({ ...newItem }, fromUser);

    this.logger.debug(`User ${this.requestedBy} safely updated item ${this.id}`);

    // Apply changeset
    await this.processUpdate(newItem);
    return true;
  }

  public async clearNotification(user_id: string) {
    this.logger.info(`Clearing notification on item ${this.id} for user ${user_id}`);
    var newNotifications = this.content.notifications;
    const i = newNotifications.findIndex((x) => x.user_id === user_id);
    newNotifications.splice(i, 1);
    await this.safeUpdate({ ...this.content, notifications: newNotifications }, user_id);
  }

  public displayName() {
    return `${this.content.title} (${this.content.id})`;
  }

  // Helpers
  private throwIfReadOnly(perm?: Permission) {
    if (!perm || perm === Permission.Viewer || perm === Permission.Invited) {
      this.logger.error(`User ${this.requestedBy} tried to modify as Viewer on ${this.id}`);
      throw new Error('User does not have permission to edit this item');
    }
  }

  private throwIfModifiedOtherNotifications(fromUser: UserModel, proposed: ListItem) {
    if (!proposed.notifications) {
      return;
    }

    var success = true;
    if (!this.content.notifications && proposed.notifications) {
      success = !proposed.notifications || proposed.notifications?.length <= 1;
    } else {
      var old = JSON.stringify(
        this.content.notifications.filter((x) => x.user_id !== fromUser.getId())
      );
      var recent = JSON.stringify(
        proposed.notifications.filter((x) => x.user_id !== fromUser.getId())
      );
      success = old === recent;
    }

    if (!success) {
      this.logger.error(
        `User ${this.requestedBy} tried to modify other users notifications on ${this.id}`
      );
      throw new Error('Users can only update their own notifications');
    }
  }

  private handleNotificationChanges(proposed: ListItem) {
    const oldNotif =
      this.content.notifications &&
      this.content.notifications.find((x) => x.user_id === this.requestedBy);
    const newNotif =
      proposed.notifications && proposed.notifications.find((x) => x.user_id === this.requestedBy);

    if (!oldNotif && newNotif) {
      this.logger.info(`User ${this.requestedBy} set new notification on ${proposed.id}`);
      notificationManager.setEventNotification(proposed, this.requestedBy);
    } else if (oldNotif && newNotif && JSON.stringify(oldNotif) !== JSON.stringify(newNotif)) {
      notificationManager.updateEventNotification(proposed, this.requestedBy);
    } else if (oldNotif && !newNotif) {
      notificationManager.removeEventNotification(proposed, this.requestedBy);
    }
  }

  private handleTimeChanges(proposed: ListItem, from: UserModel) {
    const timeChanged = proposed.time !== this.content.time;
    const dateChanged = proposed.date !== this.content.date;
    const changes = timeChanged || dateChanged;

    // Update when notifications should send
    if (changes && this.content.notifications) {
      for (const notification of this.content.notifications) {
        // Case: date or time was deleted
        if (!proposed.time || !proposed.date) {
          notificationManager.removeEventNotification(proposed, notification.user_id);
          continue;
        }

        // Otherwise update them all
        var oldNotif =
          this.content.notifications &&
          this.content.notifications.find((x) => x.user_id === notification.user_id);
        if (!oldNotif) {
          notificationManager.setEventNotification(proposed, notification.user_id);
        } else {
          notificationManager.updateEventNotification(proposed, notification.user_id);
        }
      }

      // Notify any other users of a change!
      if (timeChanged) {
        SocialItemNotifications.timeChanged(from, proposed);
      }
      if (dateChanged) {
        SocialItemNotifications.dateChanged(from, proposed);
      }
    }
  }

  private handleStatusChanges(proposed: ListItem, from: UserModel) {
    const statusChanged = proposed.status !== this.content.status;
    const statusChangeRelevant =
      proposed.status === ItemStatus.Done || proposed.status === ItemStatus.Cancelled;

    // Notify any other users of a change!
    if (statusChanged && statusChangeRelevant) {
      SocialItemNotifications.statusChanged(from, proposed);
    }
  }

  // Determine whether to update or add as suggestion
  private async processUpdate(proposed: ListItem) {
    if (this.content.suggestions_only) {
      this.updateAsSuggestion(proposed, this.requestedBy);
    } else {
      this.content = proposed;
    }

    await this.commit();
  }

  private updateAsSuggestion(new_item: ListItem, user_id: string) {
    this.content.suggested_changes?.push({
      data: new_item,
      user_id,
      approved_by: [],
      dismissed_by: []
    });
  }
}
