import { ID, UserAccess } from "../api/abstract";
import { ListItem } from "../api/list";
import db from "../repository/dbAccess";
import itemService from "../services/itemService";

export class ItemModel {
  private id: ID;
  public item?: ListItem;

  constructor(id: ID) {
    this.id = id;
  }

  public async instantiateForUser(user_id: string, checkPermissions = true) {
    var result = await db.itemsCollection().getById(this.id);
    var permitted = itemService.validateUserItemAccess(
      result as ListItem,
      user_id
    );

    if (!permitted)
      throw new Error(`User not permitted to access item ${this.id}`);
    else {
      this.item = result as ListItem;
    }
  }
}
