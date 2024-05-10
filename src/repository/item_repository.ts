import { ItemDbObject } from '../api/schema/database/items';
import { EntityRepository } from './entity_repository';

const TABLE_NAME = 'items';

export class ItemRepository extends EntityRepository<ItemDbObject> {
  constructor() {
    super(TABLE_NAME);
  }
}
