import { ItemDbObject } from '../api/schema/database/items';
import {
  ItemNotePrimaryKey,
  ItemNoteRelationshipDbObject
} from '../api/schema/database/items_on_notes';
import { NoteDbObject } from '../api/schema/database/notes';
import { RelationRepository } from './relation_repository';

const TABLE_NAME = 'items_on_notes';

export class ItemNoteRepository extends RelationRepository<ItemNoteRelationshipDbObject> {
  protected readonly pk_a = 'item_id_fk';
  protected readonly pk_b = 'note_id_fk'
  

  constructor() {
    super(TABLE_NAME);
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
