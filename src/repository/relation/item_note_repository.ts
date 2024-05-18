import { ID } from '../../api/schema/database/abstract';
import { ItemDbObject } from '../../api/schema/database/items';
import {
  ItemNoteRelationshipDbObject
} from '../../api/schema/database/items_on_notes';
import { NoteDbObject } from '../../api/schema/database/notes';
import { RelationRepository } from './_relation_repository';

const TABLE_NAME = 'items_on_notes';

export class ItemNoteRepository extends RelationRepository<ItemNoteRelationshipDbObject> {
  protected readonly pk_a = 'item_id_fk';
  protected readonly pk_b = 'note_id_fk';

  constructor() {
    super(TABLE_NAME);
  }

  public async deleteRelation(item_id: ID, note_id: ID) {
    await this.db
      .deleteFrom(this.table_name)
      .where(this.pk_a, '=', item_id)
      .where(this.pk_b, '=', note_id)
      .execute();
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

  async updateRelation(
    item_id_fk: ID,
    note_id_fk: ID,
    changes: Partial<ItemNoteRelationshipDbObject>
  ) {
    return await this.db
      .updateTable(TABLE_NAME)
      .set(changes)
      .where('item_id_fk', '=', item_id_fk)
      .where('note_id_fk', '=', note_id_fk)
      .returningAll()
      .execute();
  }
}
