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
      '/createItem',
      nSecondLimiter(30, 60),
      this.createItem
    );
    server.post('/updateItem', this.updateItem);
    server.get('/deleteItem', this.deleteItem);
    server.get('/getItem', this.getItem);

    server.post(
      '/updateItemSocial',
      this.updateItemSocial
    );
    // server.post("/addressItemSuggestion");
    // server.post("/addItemComment");
    // server.post("/editItemComment");
  }
}
