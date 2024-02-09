import { ID, Permission } from "../api/abstract";
import { ListItem } from "../api/list";
import { Logger } from "../utils/logging";
import { ItemOperations } from "./ItemOperations";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";
import { updateItemBody } from "../rest/validators/itemValidators";
import { UserOperations } from "./userOperations";
import notificationManager from "../notifications/notificationManager";
import db from "../repository/dbAccess";
import { UserModel } from "./userModel";

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
    var perm = this.getUserPermission(user_id);

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer or Invitee
    this.throwIfReadOnly(perm);

    // 2. Should only modify metadata on this endpoint
    // REMOVED UNTIL CLIENTS SEND CHANGESETS
    // this.throwIfModifiedNonMetadata(proposed);

    // 3. Should not update anyone elses notifications (this is the only restriction within modifying metadata)
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

  public async inviteUser(invitee: UserModel, invited_by: ID) {
    const inviter = this.content.permitted_users.find(
      (x) => x.user_id === invited_by
    );

    // User must be the owner to do this! (currently)
    if (!inviter || inviter?.permissions !== Permission.Owner) {
      throw new Error(
        "You must be the creator of this task/event to add other users"
      );
    }

    // Add the user to the invite list
    const newUserAccess = {
      user_id: invitee.getContent().id,
      permissions: Permission.Invitee,
    };
    this.content.invited_users
      ? this.content.invited_users.push(newUserAccess)
      : (this.content.invited_users = [newUserAccess]);
    await this.commit();
  }

  public async joinItem(user_id: ID) {
    const invite =
      this.content.invited_users &&
      this.content.invited_users.find((x) => (x.user_id = user_id));

    // Ensure user is invited
    if (!invite) {
      throw new Error("You have not been invited to this item");
    }

    // Remove user from invite list
    const i = this.content.invited_users?.findIndex((x) => x === invite)!;
    this.content.invited_users?.splice(i, 1);

    // Add user to permitted_users list
    if (invite.permissions === Permission.Invitee) {
      invite.permissions = Permission.Editor;
    }
    this.content.permitted_users.push(invite);
    await this.commit();
  }

  // Helpers
  private throwIfReadOnly(perm?: Permission) {
    if (!perm || perm === Permission.Viewer || perm === Permission.Invitee) {
      this.logger.error(
        `User ${this.requested_by} tried to modify as Viewer on ${this.id}`
      );
      throw new Error(`User does not have permission to edit this item`);
    }
  }

  private throwIfModifiedNonMetadata(proposed: ListItem) {
    var oldNonMetadataFields = JSON.stringify(
      ItemOperations.excludeMetadataFields(this.content)
    );
    var newNonMetadataFields = JSON.stringify(
      ItemOperations.excludeMetadataFields(proposed)
    );

    if (oldNonMetadataFields !== newNonMetadataFields) {
      this.logger.error(
        `User ${this.requested_by} tried to modify non-metadata on ${this.id}`
      );
      throw new Error(`Editors can only modify metadata`);
    }
  }

  private throwIfModifiedOtherNotifications(
    user_id: string,
    proposed: ListItem
  ) {
    if (!proposed.notifications) return;

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
