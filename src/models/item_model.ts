import { Item } from '../api/schema/items';
import { User } from '../api/schema/user';
import { BaseModel } from './base_model';

export class ItemModel extends BaseModel<Item> {
  constructor(content: Item, requestor: User) {
    super(content, requestor);
  }
}
