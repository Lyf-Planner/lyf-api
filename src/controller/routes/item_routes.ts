import express, { Application } from 'express';

import { ItemHandlers } from '../handlers/item_handlers';
import { validate } from '../middleware/validation_middleware';
import { API_PREFIX, nSecondLimiter } from '../utils';
import {
  createItemValidator,
  deleteItemValidator,
  getItemsValidator,
  getItemValidator,
  updateItemSocialValidator,
  updateItemValidator
} from '../validators/item_validators';

const ROUTE_PREFIX = API_PREFIX + '/items'

export class ItemEndpoints extends ItemHandlers {
  constructor(server: Application) {
    super();
    server.get(ROUTE_PREFIX + '/get', this.getItem);
    server.get(ROUTE_PREFIX + '/delete', this.deleteItem);
    server.get(ROUTE_PREFIX + '/timetable', this.getTimetable)

    server.post(ROUTE_PREFIX + '/create', nSecondLimiter(30, 60), this.createItem);
    server.post(ROUTE_PREFIX + '/update', this.updateItem);
    server.post(ROUTE_PREFIX + '/updateSocial', this.updateItemSocial);

    // server.post("/addressItemSuggestion");
    // server.post("/addItemComment");
    // server.post("/editItemComment");
  }
}
