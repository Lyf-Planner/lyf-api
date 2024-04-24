import { ItemDbObject } from '../../api/schema/database/items';
import {
  ItemNoteRelations,
  ItemNoteRelationshipDbObject
} from '../../api/schema/database/items_on_notes';
import { NoteRelatedItem } from '../../api/schema/notes';
import { BaseRelation } from './base_relation';

export class NoteItemRelation extends BaseRelation<NoteRelatedItem> {
  protected parseBase(base_db_object: ItemDbObject) {
    return base_db_object;
  }

  protected parseRelation(relation_db_object: ItemNoteRelationshipDbObject): ItemNoteRelations {
    const { note_id_fk, item_id_fk, ...relations } = relation_db_object;
    return relations;
  }

  protected parse(
    base_db_object: ItemDbObject,
    relation_db_object: ItemNoteRelationshipDbObject
  ): NoteRelatedItem {
    return {
      ...this.parseBase(base_db_object),
      ...this.parseRelation(relation_db_object)
    };
  }
}
