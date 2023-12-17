import { Request, Response } from "express";
import authUtils from "../auth/authUtils";
import db from "../repository/dbAccess";
import { Permission } from "../api/abstract";
import { ObjectId } from "mongodb";
import { Logger } from "../utils/logging";
import { ListItem, ListItemInput } from "../api/list";
import { ItemModel } from "../models/itemModel";

export class ItemHandlers {
  private logger = Logger.of(ItemHandlers);

  protected async createItem(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    var itemInput = req.body as ListItemInput;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Should validate item input here!

    // Instantiate
    var model = await ItemModel.createNew(itemInput, user_id, true);

    res.status(200).send(model.getItem());
  }

  protected updateItem(req: Request, res: Response) {
    var { item } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    var model = new ItemModel(item);
  }
}
