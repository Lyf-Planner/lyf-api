import { Request, Response } from 'express';
import PQueue from 'p-queue';

import { Item } from '../../api/schema/items';
import { ItemService } from '../../services/entity/item_service';
import { SocialUpdate } from '../../services/relation/_social_service';
import { SocialItemService } from '../../services/relation/social_item_service';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { getMiddlewareVars } from '../utils';
import { UserRelatedItem } from '../../api/schema/user';
import { ItemDbObject } from '../../api/schema/database/items';
import { ID, Identifiable } from '../../api/schema/database/abstract';

const itemUpdateQueue = new PQueue({ concurrency: 1 });

export class ItemHandlers {
  static async _queuedUpdateItem(req: Request, res: Response) {
    const changes = req.body as Partial<UserRelatedItem> & Identifiable;
    const item_id = changes.id;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Updating item ${item_id} from user ${user_id}`);

    const itemService = new ItemService();

    try {
      if (!item_id) {
        throw new LyfError('Update must include item id', 500);
      }

      const item = await itemService.processUpdate(item_id, changes, user_id);

      res.status(200).json(await item.export()).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(lyfError.code + " - " + lyfError.message);
      res.status(lyfError.code).end(lyfError.message);
    }
  }

  static async _queuedUpdateItemSocial(req: Request, res: Response) {
    const update = req.body as SocialUpdate;
    const fromId = getMiddlewareVars(res).user_id;

    const socialItemService = new SocialItemService();

    try {
      const item = await socialItemService.processUpdate(fromId, update);
      res.status(200).json(item).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(lyfError.code + " - " + lyfError.message);
      res.status(lyfError.code).end(lyfError.message);
    }
  }

  protected async createItem(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    const input = req.body as UserRelatedItem;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating item ${input.title} from user ${user_id}`);

    try {
      const service = new ItemService();
      const item = await service.processCreation(input, user_id, input.sorting_rank);

      res.status(201).json(await item.export()).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(lyfError.code + " - " + lyfError.message);
      res.status(lyfError.code).end(lyfError.message);
    }
  }

  protected async deleteItem(req: Request, res: Response) {
    const { item_id } = req.query as { item_id: string };
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting item ${item_id} as requested by ${user_id}`);

    // Authorisation checks
    try {
      const service = new ItemService();
      await service.processDeletion(item_id, user_id);

      res.status(204).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(lyfError.code + " - " + lyfError.message);
      res.status(lyfError.code).end(lyfError.message);
    }
  }

  protected async getItem(req: Request, res: Response) {
    const { item_id } = req.query as { item_id: string };
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving item ${item_id} for user ${user_id}`);

    // Authorisation checks
    try {
      const service = new ItemService();
      const item = await service.getEntity(item_id);
      res.status(200).json(item.export(user_id)).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(lyfError.code + " - " + lyfError.message);
      res.status(lyfError.code).end(lyfError.message);
    }
  }

  protected async getTimetable(req: Request, res: Response) {
    const { user_id, start_date } = req.query as { user_id: string, start_date: string };
    const requestor_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving timetable of ${user_id} for user ${requestor_id}`);

    // Authorisation checks
    try {
      const service = new ItemService();
      const timetable = await service.getTimetable(user_id, requestor_id, start_date);

      res.status(200).json(timetable).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(lyfError.code + " - " + lyfError.message);
      res.status(lyfError.code).end(lyfError.message);
    }
  }

  protected async updateItem(req: Request, res: Response) {
    itemUpdateQueue.add(async () => await ItemHandlers._queuedUpdateItem(req, res));
  }

  protected async updateItemSocial(req: Request, res: Response) {
    itemUpdateQueue.add(async () => await ItemHandlers._queuedUpdateItemSocial(req, res));
  }
}

const logger = Logger.of(ItemHandlers);
