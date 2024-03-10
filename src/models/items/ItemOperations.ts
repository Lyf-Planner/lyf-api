import { ID } from "../../api/abstract";
import {
  ItemSettings,
  ItemStatus,
  ListItem,
  ListItemTypes,
} from "../../api/list";
import { ItemModel } from "./itemModel";
import { Logger } from "../../utils/logging";
import { SocialItem } from "../social/socialItem";
import { formatDateData } from "../../utils/dates";
import { Permission } from "../../api/social";
import { v4 as uuid } from "uuid";
import db from "../../repository/dbAccess";
import { UserOperations } from "../users/userOperations";
import { SocialUser } from "../social/socialUser";

export class ItemOperations {
  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true,
    social = false
  ): Promise<ItemModel> {
    var result = await db.itemsCollection().getById(id);
    var item = social
      ? new SocialItem(result as ListItem, true, user_id)
      : new ItemModel(result as ListItem, true, user_id);

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
    const item = model.getContent();

    // Need to ensure we include routine users if it has a template_id!
    if (item.template_id && item.permitted_users?.length > 1) {
      let otherUsers = this.usersExceptFrom(user_id, item);
      for (let user of otherUsers) {
        let socialUser = (await UserOperations.retrieveForUser(
          user,
          user_id,
          true
        )) as SocialUser;
        await socialUser.addRoutineInstantiation(item);
      }
    }

    if (commit) await model.commit();

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

  static async createUserIntroItem(user_id: string) {
    let userIntroItem = {
      id: uuid(),
      title: "Swipe Me Left!",
      type: ListItemTypes.Event,
      status: ItemStatus.Upcoming,
      date: formatDateData(new Date()),
      day: null,
      desc: "This is your first item!\nTo create another like it, type it into the desired day\nTo delete this, hold it down",

      permitted_users: [
        { user_id, displayed_as: user_id, permissions: Permission.Owner },
      ],
      notifications: [],
    } as any;
    let firstItem = new ItemModel(userIntroItem, false, user_id);
    await firstItem.commit();

    return firstItem.getId();
  }

  public static usersExceptFrom(from_id: ID, item: ListItem) {
    return item.permitted_users
      .map((x) => x.user_id)
      .filter((x) => x !== from_id);
  }
}
