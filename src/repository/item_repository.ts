import { ItemDbObject } from '../api/schema/database/items';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'items';

export class ItemRepository extends BaseRepository<ItemDbObject> {
  constructor() {
    super(TABLE_NAME);
  }
}
