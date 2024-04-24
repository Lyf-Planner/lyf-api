import { ItemDbObject } from '../api/schema/database/items';
import {
  ItemNotePrimaryKey,
  ItemNoteRelationshipDbObject
} from '../api/schema/database/items_on_notes';
import { NoteDbObject } from '../api/schema/database/notes';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'items_on_notes';

export class ItemNoteRepository extends BaseRepository<ItemNoteRelationshipDbObject> {
  constructor() {
    super(TABLE_NAME);
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

  async findNoteRelatedItems(note_id: string): Promise<(ItemDbObject & ItemNoteRelationshipDbObject)[]> {
    return await this.db
      .selectFrom('items')
      .innerJoin('items_on_notes', 'items.id', 'items_on_notes.item_id_fk')
      .selectAll()
      .where('note_id_fk', '=', note_id)
      .execute();
  }

  async findItemRelatedNotes(item_id: string): Promise<(NoteDbObject & ItemNoteRelationshipDbObject)[]> {
    return await this.db
      .selectFrom('notes')
      .innerJoin('items_on_notes', 'notes.id', 'items_on_notes.note_id_fk')
      .selectAll()
      .where('item_id_fk', '=', item_id)
      .execute();
  }
}
