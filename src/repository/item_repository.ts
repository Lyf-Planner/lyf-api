import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { ItemDbObject } from '../api/schema/items';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'items';

export class ItemRepository extends BaseRepository<ItemDbObject> {
  constructor(db: Kysely<Database>) {
    super(db, TABLE_NAME);
  }
}
