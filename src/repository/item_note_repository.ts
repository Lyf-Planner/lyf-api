import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import {
  ItemNotePrimaryKey,
  ItemNoteRelationship,
  ItemNoteRelationshipDbObject
} from '../api/schema/items_on_notes';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'items_on_notes';

export class ItemNoteRepository extends BaseRepository<ItemNoteRelationshipDbObject> {
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

  async findItemsByNoteId(note_id: string): Promise<ItemNoteRelationship[]> {
    return await this.db
      .selectFrom('items')
      .innerJoin('items_on_notes', 'items.id', 'items_on_notes.item_id_fk')
      .selectAll()
      .where('note_id_fk', '=', note_id)
      .execute();
  }

  async findNotesByItemId(item_id: string): Promise<ItemNoteRelationship[]> {
    return await this.db
      .selectFrom('notes')
      .innerJoin('items_on_notes', 'notes.id', 'items_on_notes.note_id_fk')
      .selectAll()
      .where('item_id_fk', '=', item_id)
      .execute();
  }
}
