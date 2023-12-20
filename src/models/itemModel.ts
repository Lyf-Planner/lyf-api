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
import { ItemPermissions } from "./ItemPermissions";

export class ItemModel {
  private logger = Logger.of(ItemModel);
  private id: ID;
  private item: ListItem;
  private from_db: boolean;
  private requested_by?: string;

  constructor(item: ListItem, from_db: boolean = false, requested_by?: string) {
    this.id = item._id;
    this.item = item;
    this.from_db = from_db;
    this.requested_by = requested_by;
  }

  public getItem = () => this.item;
  public getRequestor = () => this.requested_by;
  public isFromDb = () => this.from_db;

  // Upserts state to db
  public async commit() {
    // Commit should notify users if multiple!

    await db.itemsCollection().update(this.item, true);
  }

  public async delete() {
    await db.itemsCollection().delete(this.item._id);
  }

  public updateAsSuggestion(new_list: ListItem, user_id: string) {
    this.item.suggested_changes?.push({
      data: new_list,
      user_id,
      approved_by: [],
      dismissed_by: [],
    });
  }

  public requestorPermission() {
    if (!this.requested_by) return;
    return ItemPermissions.getUserPermission(this.item, this.requested_by);
  }

  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true
  ): Promise<ItemModel> {
    var result = await db.itemsCollection().getById(id);
    var permitted =
      !checkPermissions ||
      ItemPermissions.validateUserItemAccess(result as ListItem, user_id);

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
    commit = false
  ): Promise<ItemModel> {
    var item = itemInput as any;
    item._id = new ObjectId();
    item.permitted_users = [{ user_id, permissions: Permission.Owner }];
    item.created = new Date();
    item = item as ListItem;

    var model = new ItemModel(item, false, user_id);
    if (commit) await model.commit();

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
        !validate_access || ItemPermissions.validateUserItemAccess(x, user_id)
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
    return {
      suggestions_only: item.suggestions_only,
      template_item: item.template_item,
    };
  }

  static socialFieldsOnly(item: ListItem): ItemSocialData {
    return {
      suggested_changes: item.suggested_changes,
      comments: item.comments,
      permitted_users: item.permitted_users,
      invited_users: item.invited_users,
    };
  }
}
