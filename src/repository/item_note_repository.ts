import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { ItemNotePrimaryKey, ItemNoteRelationshipDbObject } from '../api/schema/items_on_notes';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'items_on_notes';

export class ItemNoteRepository extends BaseRepository {
  constructor(db: Kysely<Database>) {
    super(db, TABLE_NAME); // 'composite' is just a placeholder
  }

  async findByCompositeId({
    item_id_fk,
    note_id_fk
  }: ItemNotePrimaryKey): Promise<ItemNoteRelationshipDbObject | undefined> {
    return this.db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where('item_id_fk', '=', item_id_fk)
      .where('note_id_fk', '=', note_id_fk)
      .executeTakeFirst();
  }

  async findByNoteId(note_id: string): Promise<ItemNoteRelationshipDbObject[]> {
    return this.db.selectFrom(TABLE_NAME).selectAll().where('note_id_fk', '=', note_id).execute();
  }

  async findByItemId(item_id: string): Promise<ItemNoteRelationshipDbObject[]> {
    return this.db.selectFrom(TABLE_NAME).selectAll().where('item_id_fk', '=', item_id).execute();
  }
}
