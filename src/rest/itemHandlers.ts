import { Request, Response } from "express";
import authUtils from "../auth/authUtils";
import db from "../repository/dbAccess";
import { Permission } from "../api/abstract";
import { ObjectId } from "mongodb";
import { Logger } from "../utils/logging";
import { ListItem, ListItemInput } from "../api/list";
import { ItemModel } from "../models/itemModel";
import { ItemOperations } from "../models/ItemOperations";

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
    var model = await ItemOperations.createNew(itemInput, user_id, true);

    res.status(200).send(model.getContent());
  }

  protected async updateItem(req: Request, res: Response) {
    var item = req.body as ListItem;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    var remoteItem: ItemModel;

    // Authorisation checks
    try {
      // These fns will check user is permitted on the item and has Permission > Viewer
      remoteItem = await ItemOperations.retrieveForUser(item._id, user_id);
      await remoteItem.safeUpdate(item, user_id);
    } catch (err) {
      res.send(403).end(err);
      return;
    }

    res.send(200).end();
  }

  protected async deleteItem(req: Request, res: Response) {
    var { item_id } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var item: ItemModel;
    try {
      var item = await ItemOperations.retrieveForUser(item_id, user_id);
      var perm = item.requestorPermission();
      if (!perm || perm !== Permission.Owner)
        throw new Error(`Items can only be deleted by their owner/creator`);
    } catch (err) {
      res.status(403).end(err);
    }

    // Perform delete
    await item!.deleteFromDb();
    res.status(200).end();
  }

  protected async getItem(req: Request, res: Response) {
    var { item_id } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var item: ItemModel;
    try {
      item = await ItemOperations.retrieveForUser(item_id, user_id);
    } catch (err) {
      res.status(403).end(err);
    }

    res.status(200).json(item!.getContent()).end();
  }

  protected async getItems(req: Request, res: Response) {
    var { item_ids } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // No auth checks - automatically excludes those without perms
    var items = await ItemOperations.getRawUserItems(item_ids, user_id, true);

    res.status(200).json(items!).end();
  }
}
