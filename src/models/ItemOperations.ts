import { ID } from "../api/abstract";
import { ItemSettings, ListItem } from "../api/list";
import { ItemModel } from "./itemModel";
import { Logger } from "../utils/logging";
import db from "../repository/dbAccess";

export class ItemOperations {
  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true
  ): Promise<ItemModel> {
    var result = await db.itemsCollection().getById(id);
    var item = new ItemModel(result as ListItem, true, user_id);

    var permitted = !checkPermissions || !!item.getUserPermission(user_id);
    if (!permitted)
      throw new Error(`User ${user_id} is not permitted to access item ${id}`);
    else {
      return item;
    }
  }

  // Builder method
  static async createNew(
    itemInput: ListItem,
    user_id: string,
    commit = false // Also create in db
  ): Promise<ItemModel> {
    var model = new ItemModel(itemInput, false, user_id);
    if (commit) await model.commit(true);

    return model;
  }

  static async getRawUserItems(
    ids: ID[],
    user_id: string,
    validate_access = true
  ): Promise<ListItem[]> {
    var results = await db.itemsCollection().getManyById(ids, false);
    var items = results.map((x) => new ItemModel(x as ListItem, true, user_id));

    var filteredResults = items.filter(
      (x) => !validate_access || !!x.getUserPermission(user_id)
    );

    if (filteredResults.length !== results.length) {
      let logger = Logger.of(ItemModel);
      logger.warn(
        `User no longer has access to ${
          results.length - filteredResults.length
        } items`
      );
    }

    return filteredResults.map((x) => x.export());
  }

  static isTemplate(item: ListItem) {
    return item.day && !item.date;
  }

  static settingsFieldsOnly(item: ListItem): ItemSettings {
    // Needs validator
    return {
      suggestions_only: item.suggestions_only,
    };
  }

  static excludeMetadataFields(item: ListItem): any {
    var {
      title,
      type,
      status,
      date,
      day,
      desc,
      time,
      notifications,
      ...remaining
    } = item;
    // Need to validate the excluded items are of type ItemMetadata, so this function will error if that type is changed!
    return remaining;
  }
}
