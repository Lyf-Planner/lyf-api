import { Request, Response } from 'express';
import PQueue from 'p-queue';

import { Logger } from '../../../utils/logging';
import { getMiddlewareVars } from '../../utils';
import {
  createItemBody,
  getItemsBody,
  updateItemBody,
  updateItemSocialBody
} from '../../validators/itemValidators';
import { ItemService } from '../../../services/item_service';

const itemUpdateQueue = new PQueue({ concurrency: 1 });

export class ItemHandlers {
  static async _queuedUpdateItem(req: Request, res: Response) {
    const item = req.body as updateItemBody;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Updating item ${item.title} (${item.id}) from user ${user_id}`);

    // Authorisation checks
    try {
      // These fns will check user is permitted on the item and has Permission > Viewer
      const remoteItem = await ItemOperations.retrieveForUser(item.id, user_id);
      await remoteItem.safeUpdate(item, user_id);

      res.status(200).json(remoteItem.export()).end();
    } catch (err) {
      logger.error(`User ${user_id} did not safely update item ${item.id}: ${err}`);
      res.status(403).end(`${err}`);
    }
  }

  static async _queuedUpdateItemSocial(req: Request, res: Response) {
    const update = req.body as updateItemSocialBody;
    const fromId = getMiddlewareVars(res).user_id;

    try {
      const social = await SocialItemManager.processUpdate(fromId, update);
      res.status(200).json(social).end();
    } catch (err) {
      logger.error(`Returning 400 with message: ${err}`);
      res.status(400).end(`${err}`);
    }
  }

  protected async createItem(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    const itemInput = req.body as createItemBody;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating item ${itemInput.title} from user ${user_id}`);

    // Instantiate
    const model = await new ItemService().(itemInput, user_id, true);

    res.status(201).json(model.export()).end();
  }

  protected async deleteItem(req: Request, res: Response) {
    const { item_id } = req.query;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting item ${item_id} as requested by ${user_id}`);

    // Authorisation checks
    try {
      const item = await ItemOperations.retrieveForUser(item_id as string, user_id);

      const perm = item.requestorPermission();
      if (!perm || perm !== Permission.Owner) {
        throw new Error('Items can only be deleted by their owner/creator');
      }

      await item.delete();
      res.status(204).end();
    } catch (err) {
      logger.error(`User ${user_id} tried to delete ${item_id} without valid permissions`);
      res.status(403).end(`${err}`);
      return;
    }
  }

  protected async getItem(req: Request, res: Response) {
    const { item_id } = req.query as { item_id: string };
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving item ${item_id} for user ${user_id}`);

    // Authorisation checks
    try {
      const item = await ItemOperations.retrieveForUser(item_id, user_id);
      res.status(200).json(item!.export()).end();
    } catch (err) {
      logger.error(`User ${user_id} requested item ${item_id} to which they don't have access`);
      res.status(403).end(`${err}`);
    }
  }

  protected async getItems(req: Request, res: Response) {
    const { item_ids } = req.body as getItemsBody;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving ${item_ids.length} items for user ${user_id}`);

    // No auth checks - automatically excludes those without perms
    const items = await ItemOperations.getRawUserItems(item_ids, user_id, true);
    logger.debug(`Got ${items.length} items for user`);

    res.status(200).json(items!).end();
  }

  protected async updateItem(req: Request, res: Response) {
    itemUpdateQueue.add(async () => await ItemHandlers._queuedUpdateItem(req, res));
  }

  protected async updateItemSocial(req: Request, res: Response) {
    itemUpdateQueue.add(async () => await ItemHandlers._queuedUpdateItemSocial(req, res));
  }
}

const logger = Logger.of(ItemHandlers);
