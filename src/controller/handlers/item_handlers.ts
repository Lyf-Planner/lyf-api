import { Request, Response } from 'express';
import PQueue from 'p-queue';

import { Identifiable } from '../../../schema/database/abstract';
import { UserRelatedItem } from '../../../schema/user';
import { WeatherService } from '../../modules/weather/weather_service';
import { ItemService } from '../../services/entity/item_service';
import { UserService } from '../../services/entity/user_service';
import { SocialUpdate } from '../../services/relation/_social_service';
import { SocialItemService } from '../../services/relation/social_item_service';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { getMiddlewareVars } from '../utils';

const itemUpdateQueue = new PQueue({ concurrency: 1 });

export class ItemHandlers {
  static async _queuedUpdateItem(req: Request, res: Response) {
    const changes = req.body as Partial<UserRelatedItem> & Identifiable;
    const item_id = changes.id;
    const { user_id } = getMiddlewareVars(res);

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
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  static async _queuedUpdateItemSocial(req: Request, res: Response) {
    const update = req.body as SocialUpdate;
    const fromId = getMiddlewareVars(res).user_id;

    const socialItemService = new SocialItemService();

    try {
      const resultingRelation = await socialItemService.processUpdate(fromId, update);
      res.status(200).json(resultingRelation
        ? await resultingRelation.export()
        : null)
        .end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async createItem(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    const input = req.body as UserRelatedItem;
    const { user_id } = getMiddlewareVars(res);

    logger.debug(`Creating item ${input.title} from user ${user_id}`);

    try {
      const service = new ItemService();
      const item = await service.processCreation(input, user_id, input.sorting_rank);

      res.status(201).json(await item.export()).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async deleteItem(req: Request, res: Response) {
    const { item_id } = req.query as { item_id: string };
    const { user_id } = getMiddlewareVars(res);

    logger.debug(`Deleting item ${item_id} as requested by ${user_id}`);

    // Authorisation checks
    try {
      const service = new ItemService();
      await service.processDeletion(item_id, user_id);

      res.status(204).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getItem(req: Request, res: Response) {
    const { id, include } = req.query as { id: string, include: string };
    const { user_id } = getMiddlewareVars(res);

    logger.debug(`Retrieving item ${id} for user ${user_id}`);

    // Authorisation checks
    try {
      const service = new ItemService();
      const item = await service.getEntity(id, include);
      const result = await item.exportWithPermission(user_id);

      res.status(200).json(result).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getTimetable(req: Request, res: Response) {
    const { start_date } = req.query as { start_date: string };
    const requestor_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving timetable of ${requestor_id}`);

    // Authorisation checks
    try {
      const service = new ItemService();
      const timetable = await service.getTimetable(requestor_id, start_date);

      res.status(200).json(timetable).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getTimetableWeather(req: Request, res: Response) {
    const { start_date, end_date, lat, lon } = req.query as { start_date: string, end_date: string, lat: string, lon: string };
    const requestor_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving weather of ${requestor_id} for range ${start_date}-${end_date}`);

    try {
      const coordinates = {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      }

      const user = await new UserService().getEntity(requestor_id, '');

      const weatherData = await WeatherService.getWeather(user, start_date, end_date, coordinates);

      res.status(200).json(weatherData).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error(`${lyfError.code || 500} - ${lyfError.message}`);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async updateItem(req: Request, res: Response) {
    itemUpdateQueue.add(async () => await ItemHandlers._queuedUpdateItem(req, res));
  }

  protected async updateItemSocial(req: Request, res: Response) {
    itemUpdateQueue.add(async () => await ItemHandlers._queuedUpdateItemSocial(req, res));
  }
}

const logger = Logger.of(ItemHandlers.name);
