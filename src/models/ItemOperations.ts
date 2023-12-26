import { ObjectId } from "mongodb";
import { ID, Permission, Time } from "../api/abstract";
import {
  ItemSettings,
  ItemSocialData,
  ItemStatus,
  ListItem,
  ListItemInput,
} from "../api/list";
import db from "../repository/dbAccess";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";
import { ItemModel } from "./itemModel";
import { Logger } from "../utils/logging";
import { v4 as uuid } from "uuid";

export class ItemOperations {
  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true
  ): Promise<ItemModel> {
    var result = await db.itemsCollection().getById(id);
    var permitted =
      !checkPermissions ||
      !!RestrictedRemoteObject.getUserPermission(
        result?.permitted_users!,
        user_id
      );

    if (!permitted)
      throw new Error(`User ${user_id} is not permitted to access item ${id}`);
    else {
      return new ItemModel(result as ListItem, true, user_id);
    }
  }

  // Builder method
  static async createNew(
    itemInput: ListItemInput,
    user_id: string,
    commit = false // Also create in db
  ): Promise<ItemModel> {
    var item = itemInput as any;
    item.id = uuid();
    item.status = ItemStatus.Upcoming;
    item.permitted_users = [{ user_id, permissions: Permission.Owner }];
    item = item as ListItem;

    var model = new ItemModel(item, false, user_id);
    if (commit) await model.commit(true);

    return model;
  }

  static async getRawUserItems(
    ids: ID[],
    user_id: string,
    validate_access = true
  ): Promise<ListItem[]> {
    var results = await db.itemsCollection().getManyById(ids, false);
    var filteredResults = results.filter(
      (x) =>
        !validate_access ||
        !!RestrictedRemoteObject.getUserPermission(x.permitted_users, user_id)
    );

    if (filteredResults.length !== results.length) {
      let logger = Logger.of(ItemModel);
      logger.warn(
        `User no longer has access to ${
          results.length - filteredResults.length
        } items`
      );
    }

    return filteredResults;
  }

  static settingsFieldsOnly(item: ListItem): ItemSettings {
    // Needs validator
    return {
      suggestions_only: item.suggestions_only,
    };
  }

  static excludeMetadata(item: ListItem): any {
    var { title, type, created, date, day, desc, time, ...remaining } = item;
    // Need to validate the excluded items are of type ItemMetadata, so this function will error if that type is changed!
    return remaining;
  }

  static socialFieldsOnly(item: ListItem): ItemSocialData {
    // Needs validator
    return {
      suggested_changes: item.suggested_changes,
      comments: item.comments,
    };
  }
}
