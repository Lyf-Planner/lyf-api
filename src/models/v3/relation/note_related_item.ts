import { ItemDbObject } from '../../../api/schema/database/items';
import {
  ItemNoteRelations,
  ItemNoteRelationshipDbObject
} from '../../../api/schema/database/items_on_notes';
import { NoteRelatedItem } from '../../../api/schema/notes';
import { BaseRelation } from './base_relation';

export class NoteItemRelation extends BaseRelation<NoteRelatedItem> {
  protected parse(combined_db_object: ItemDbObject & ItemNoteRelationshipDbObject) {
    const { note_id_fk, item_id_fk, ...parsed } = combined_db_object;
    return parsed;
  }
}
