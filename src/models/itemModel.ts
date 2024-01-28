import { Permission } from "../api/abstract";
import { ListItem } from "../api/list";
import { Logger } from "../utils/logging";
import { ItemOperations } from "./ItemOperations";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";
import { updateItemBody } from "../rest/validators/itemValidators";
import notificationManager from "../notifications/notificationManager";
import db from "../repository/dbAccess";

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
      for (let notif of this.content.notifications) {
        notificationManager.removeEventNotification(
          this.content,
          notif.user_id
        );
      }
    }
    await this.deleteFromDb();
  }

  // Update and throw if there are any permissions violations
  public async safeUpdate(
    proposed: updateItemBody,
    user_id: string
  ): Promise<boolean> {
    // Run through permissions checks for updates
    var perm = RestrictedRemoteObject.getUserPermission(
      this.content.permitted_users,
      user_id
    );

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer
    this.throwIfReadOnly(perm);

    // 2. Editors can only modify metadata
    this.throwIfEditorModifiedNonMetadata(proposed, perm);

    // 3. Should not update anyone elses notifications
    this.throwIfModifiedOtherNotifications(user_id, proposed);

    // Checks passed

    // PRE-COMMIT TASKS
    // 1. Action any notification updates
    this.handleNotificationChanges({ ...proposed });

    // 2. Handle any time changes
    this.handleTimeChanges({ ...proposed });

    this.logger.debug(
      `User ${this.requested_by} safely updated item ${this.id}`
    );

    // Apply changeset
    await this.processUpdate({ ...this.content, ...proposed });
    return true;
  }

  // Helpers
  private throwIfReadOnly(perm?: Permission) {
    if (!perm || perm === Permission.Viewer) {
      this.logger.error(
        `User ${this.requested_by} tried to modify as Viewer on ${this.id}`
      );
      throw new Error(`User does not have permission to edit this item`);
    }
  }

  private throwIfEditorModifiedNonMetadata(
    proposed: ListItem,
    perm?: Permission
  ) {
    if (perm === Permission.Editor) {
      var oldNonMetadataFields = JSON.stringify(
        ItemOperations.excludeEditorFields(this.content)
      );
      var newNonMetadataFields = JSON.stringify(
        ItemOperations.excludeEditorFields(proposed)
      );

      if (oldNonMetadataFields !== newNonMetadataFields) {
        this.logger.error(
          `User ${this.requested_by} tried to modify non-metadata on ${this.id}`
        );
        throw new Error(`Editors can only modify metadata`);
      }
    }
  }

  private throwIfModifiedOtherNotifications(
    user_id: string,
    proposed: ListItem
  ) {
    var success = true;
    if (!this.content.notifications) {
      success = !proposed.notifications || proposed.notifications.length <= 1;
    } else {
      var old = JSON.stringify(
        this.content.notifications.filter((x) => x.user_id !== user_id)
      );
      var recent = JSON.stringify(
        proposed.notifications.filter((x) => x.user_id !== user_id)
      );
      success = old === recent;
    }

    if (!success) {
      this.logger.error(
        `User ${this.requested_by} tried to modify other users notifications on ${this.id}`
      );
      throw new Error(`Users can only update their own notifications`);
    }
  }

  private handleNotificationChanges(proposed: ListItem) {
    const oldNotif =
      this.content.notifications &&
      this.content.notifications.find((x) => x.user_id === this.requested_by);
    const newNotif =
      proposed.notifications &&
      proposed.notifications.find((x) => x.user_id === this.requested_by);

    if (!oldNotif && newNotif) {
      this.logger.info(
        `User ${this.requested_by} set new notification on ${proposed.id}`
      );
      notificationManager.setEventNotification(proposed, this.requested_by);
    } else if (
      oldNotif &&
      newNotif &&
      JSON.stringify(oldNotif) !== JSON.stringify(newNotif)
    ) {
      notificationManager.updateEventNotification(proposed, this.requested_by);
    } else if (oldNotif && !newNotif) {
      notificationManager.removeEventNotification(proposed, this.requested_by);
    }
  }

  private handleTimeChanges(proposed: ListItem) {
    if (proposed.time !== this.content.time && proposed.notifications) {
      for (let notification of proposed.notifications) {
        // Case: time was deleted
        if (!proposed.time) {
          notificationManager.removeEventNotification(
            proposed,
            notification.user_id
          );
          continue;
        }

        // Otherwise update them all
        var oldNotif =
          this.content.notifications &&
          this.content.notifications.find(
            (x) => x.user_id === notification.user_id
          );
        if (!oldNotif) {
          notificationManager.setEventNotification(
            proposed,
            notification.user_id
          );
        } else {
          notificationManager.updateEventNotification(
            proposed,
            notification.user_id
          );
        }
      }

      if (proposed.permitted_users.length > 1) {
        // Notify other users of a time change
      }
    }
  }

  public async clearNotification(user_id: string) {
    this.logger.info(
      `Clearing notification on item ${this.id} for user ${user_id}`
    );
    var newNotifications = this.content.notifications;
    const i = newNotifications.findIndex((x) => x.user_id === user_id);
    newNotifications.splice(i, 1);
    await this.safeUpdate(
      { ...this.content, notifications: newNotifications },
      user_id
    );
  }

  // Determine whether to update or add as suggestion
  private async processUpdate(proposed: ListItem) {
    if (this.content.suggestions_only) {
      this.updateAsSuggestion(proposed, this.requested_by);
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
      dismissed_by: [],
    });
  }
}
