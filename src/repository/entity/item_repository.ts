import { ItemDbObject } from '#/database/items';
import { EntityRepository } from '@/repository/entity/_entity_repository';

const TABLE_NAME = 'items';

export class ItemRepository extends EntityRepository<ItemDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByNoteId(note_id: string) {
    return await this.db
      .selectFrom('items')
      .selectAll()
      .where('note_id', '=', note_id)
      .execute();
  }
}
