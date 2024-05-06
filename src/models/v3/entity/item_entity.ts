import { Item } from '../../../api/schema/items';
import { ItemRepository } from '../../../repository/item_repository';
import { Logger } from '../../../utils/logging';
import { BaseEntity } from './base_entity';

export class ItemEntity extends BaseEntity<Item> {
  protected logger = Logger.of(ItemEntity);
  protected repository = new ItemRepository();
}
