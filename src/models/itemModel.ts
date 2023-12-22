import { ObjectId } from "mongodb";
import { ID, Permission, UserAccess } from "../api/abstract";
import {
  ItemSettings,
  ItemSocialData,
  ListItem,
  ListItemInput,
} from "../api/list";
import db from "../repository/dbAccess";
import { Logger } from "../utils/logging";
import { ItemOperations } from "./ItemOperations";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";
import { TimeOperations } from "./abstract/timeOperations";

export class ItemModel extends RestrictedRemoteObject<ListItem> {
  private logger = Logger.of(ItemModel);

  constructor(item: ListItem, from_db: boolean = false, requested_by: string) {
    super(db.itemsCollection(), item, from_db, requested_by);
  }

  public export() {
    var { ...exported } = this.content;
    return exported;
  }

  // Update and throw if there are any permissions violations
  public async safeUpdate(
    proposed: ListItem,
    user_id: string
  ): Promise<boolean> {
    // Run through permissions checks for updates
    var perm = RestrictedRemoteObject.getUserPermission(
      this.content.permitted_users,
      user_id
    );

    // 1. User cannot be a Viewer
    this.throwIfReadOnly(perm);

    // 2. Editors can only modify metadata
    this.throwIfEditorModifiedNonMetadata(proposed, perm);

    // 3. No one should be editing the social fields
    this.throwIfModifiedReadOnlyFields(proposed);

    // 4. No one should modify time fields
    TimeOperations.throwIfTimeFieldsModified(this.content, proposed, user_id);

    // Checks passed!
    this.logger.info(
      `User ${this.requested_by} safely updated item ${this.id}`
    );
    await this.processUpdate(proposed);
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
        ItemOperations.excludeMetadata(this.content)
      );
      var newNonMetadataFields = JSON.stringify(
        ItemOperations.excludeMetadata(proposed)
      );

      if (oldNonMetadataFields !== newNonMetadataFields) {
        this.logger.error(
          `User ${this.requested_by} tried to modify non-metadata on ${this.id}`
        );
        throw new Error(`Editors can only modify metadata`);
      }
    }
  }

  private throwIfModifiedReadOnlyFields(proposed: ListItem) {
    // At the moment these are just the social fields

    var oldUntouchableFields = JSON.stringify(
      ItemOperations.socialFieldsOnly(this.content)
    );
    var newUntouchableFields = JSON.stringify(
      ItemOperations.socialFieldsOnly(proposed)
    );
    if (oldUntouchableFields !== newUntouchableFields) {
      this.logger.error(
        `User ${this.requested_by} tried to modify social fields on ${this.id}`
      );
      throw new Error(
        `Suggestions and comments cannot be modified on this endpoint`
      );
    }
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
