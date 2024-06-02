import express, { Application } from 'express';

import { ItemHandlers } from '../handlers/item_handlers';
import { validate } from '../middleware/validation_middleware';
import { nSecondLimiter } from '../utils';
import {
  createItemValidator,
  deleteItemValidator,
  getItemsValidator,
  getItemValidator,
  updateItemSocialValidator,
  updateItemValidator
} from '../validators/item_validators';

export class ItemEndpoints extends ItemHandlers {
  constructor(server: Application) {
    super();
    server.post(
      '/item/create',
      nSecondLimiter(30, 60),
      this.createItem
    );
    server.post('/item/update', this.updateItem);
    server.get('/item/delete', this.deleteItem);
    server.get('/item/get', this.getItem);

    server.post(
      '/item/updateSocial',
      this.updateItemSocial
    );
    // server.post("/addressItemSuggestion");
    // server.post("/addItemComment");
    // server.post("/editItemComment");
  }
}
