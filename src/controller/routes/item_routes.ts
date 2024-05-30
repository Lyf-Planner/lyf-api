import express from 'express';

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
  constructor(server: express.Application) {
    super();
    server.post(
      '/createItem',
      nSecondLimiter(30, 60),
      validate(createItemValidator),
      this.createItem
    );
    server.post('/updateItem', validate(updateItemValidator), this.updateItem);
    server.get('/deleteItem', validate(deleteItemValidator), this.deleteItem);
    server.get('/getItem', validate(getItemValidator), this.getItem);

    server.post(
      '/updateItemSocial',
      validate(updateItemSocialValidator),
      this.updateItemSocial
    );
    // server.post("/addressItemSuggestion");
    // server.post("/addItemComment");
    // server.post("/editItemComment");
  }
}
