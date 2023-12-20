import { Permission } from "../api/abstract";
import { ListItem } from "../api/list";
import { ItemModel } from "./itemModel";

export class ItemPermissions {
  static validateUserItemAccess(item: ListItem, user_id: string): boolean {
    return (
      !item.permitted_users ||
      item.permitted_users.filter((x) => x.user_id === user_id).length === 1
    );
  }

  static getUserPermission(
    item: ListItem,
    user_id: string
  ): Permission | undefined {
    var perm = item.permitted_users?.find((x) => x.user_id === user_id);
    if (!perm) return;
    else return perm.permissions;
  }

  static permissibleMetadataUpdate(
    old_item: ListItem,
    new_item: ListItem,
    user_id: string,
    throwOnUnauthorised: boolean = false
  ): boolean {
    // Run through permissions checks for updates
    var perm = this.getUserPermission(old_item, user_id);

    // 1. User is not Read Only
    if (!perm || perm === Permission.Viewer) {
      if (throwOnUnauthorised)
        throw new Error(`User does not have permission to edit this item`);
      return false;
    }

    // 2. Editor did not modify owner only fields (settings)
    if (perm === Permission.Editor) {
      var oldOwnerFields = JSON.stringify(
        ItemModel.settingsFieldsOnly(old_item)
      );
      var newOwnerFields = JSON.stringify(
        ItemModel.settingsFieldsOnly(new_item)
      );

      if (oldOwnerFields !== newOwnerFields) {
        if (throwOnUnauthorised)
          throw new Error(`Editors can only modify metadata`);
        return false;
      }
    }

    // 3. Cannot modify untouchable fields (social data)
    var oldUntouchableFields = JSON.stringify(
      ItemModel.socialFieldsOnly(old_item)
    );
    var newUntouchableFields = JSON.stringify(
      ItemModel.socialFieldsOnly(new_item)
    );
    if (oldUntouchableFields !== newUntouchableFields) {
      if (throwOnUnauthorised)
        throw new Error(
          `Suggestions and comments cannot be modified on this endpoint`
        );
      return false;
    }

    return true;
  }
}
