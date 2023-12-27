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
  protected async createItem(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    var itemInput = req.body as ListItemInput;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    logger.debug(`Creating item ${itemInput.title} from user ${user_id}`);

    // Should validate item input here!

    // Instantiate
    var model = await ItemOperations.createNew(itemInput, user_id, true);

    res.status(200).json(model.export()).end();
  }

  protected async updateItem(req: Request, res: Response) {
    var item = req.body as ListItem;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    var remoteItem: ItemModel;
    logger.debug(
      `Updating item ${item.title} (${item.id}) from user ${user_id}`
    );

    // Authorisation checks
    try {
      // These fns will check user is permitted on the item and has Permission > Viewer
      remoteItem = await ItemOperations.retrieveForUser(item.id, user_id);
      await remoteItem.safeUpdate(item, user_id);
    } catch (err) {
      logger.error(`User ${user_id} did not safely update item ${item.id}`);
      res.send(403).end(`${err}`);
      return;
    }

    res.send(200).end();
  }

  protected async deleteItem(req: Request, res: Response) {
    var { item_id } = req.query;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var item: ItemModel;
    try {
      var item = await ItemOperations.retrieveForUser(
        item_id as string,
        user_id
      );
      var perm = item.requestorPermission();
      if (!perm || perm !== Permission.Owner)
        throw new Error(`Items can only be deleted by their owner/creator`);
    } catch (err) {
      logger.error(
        `User ${user_id} tried to delete ${item_id} without valid permissions`
      );
      res.status(403).end(`${err}`);
    }

    // Perform delete
    await item!.deleteFromDb();
    res.status(200).end();
  }

  protected async getItem(req: Request, res: Response) {
    var { item_id } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    logger.info(`Retreiving item ${item_id} for user ${user_id}`);

    // Authorisation checks
    var item: ItemModel;
    try {
      item = await ItemOperations.retrieveForUser(item_id, user_id);
    } catch (err) {
      logger.error(
        `User ${user_id} requested item ${item_id} to which they don't have access`
      );
      res.status(403).end(`${err}`);
    }

    res.status(200).json(item!.export()).end();
  }

  protected async getItems(req: Request, res: Response) {
    var { item_ids } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    logger.info(`Retreiving items <${item_ids}> for user ${user_id}`);

    // No auth checks - automatically excludes those without perms
    var items = await ItemOperations.getRawUserItems(item_ids, user_id, true);
    logger.debug(`Got items ${items.map((x) => x.id)} for user`);

    res.status(200).json(items!).end();
  }
}

const logger = Logger.of(ItemHandlers);
