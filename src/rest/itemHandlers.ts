import { Request, Response } from "express";
import authUtils from "../auth/authUtils";
import db from "../repository/dbAccess";
import { Permission } from "../api/abstract";
import { ObjectId } from "mongodb";
import { Logger } from "../utils/logging";
import { ListItem, ListItemInput } from "../api/list";
import { ItemModel } from "../models/itemModel";
import { ItemPermissions } from "../models/ItemPermissions";

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

  protected async updateItemMetadata(req: Request, res: Response) {
    var item = req.body as ListItem;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    var newItem = new ItemModel(item, false, user_id);
    var remoteItem: ItemModel;

    // Authorisation checks
    try {
      // These fns will check user is permitted on the item and has Permission > Viewer
      remoteItem = await ItemModel.retrieveForUser(item._id, user_id);
      ItemPermissions.permissibleMetadataUpdate(
        remoteItem.getItem(),
        newItem.getItem(),
        user_id,
        true
      );
    } catch (err) {
      res.send(403).end(err);
      return;
    }

    // Perform update
    if (item.suggestions_only) {
      remoteItem!.updateAsSuggestion(item, user_id);
      await remoteItem!.commit();
    } else {
      await newItem.commit();
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
      var item = await ItemModel.retrieveForUser(item_id, user_id);
      var perm = item.requestorPermission();
      if (perm !== Permission.Owner)
        throw new Error(`Items can only be deleted by their owner/creator`);
    } catch (err) {
      res.status(403).end(err);
    }

    // Perform delete
    await item!.delete();
    res.status(200).end();
  }

  protected async getItem(req: Request, res: Response) {
    var { item_id } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var item: ItemModel;
    try {
      item = await ItemModel.retrieveForUser(item_id, user_id);
    } catch (err) {
      res.status(403).end(err);
    }

    res.status(200).json(item!.getItem()).end();
  }

  protected async getItems(req: Request, res: Response) {
    var { item_ids } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // No auth checks need - automatically excludes those without perms
    var items = await ItemModel.getRawUserItems(item_ids, user_id, true);

    res.status(200).json(items!).end();
  }
}
