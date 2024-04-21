import { ID, Timestamps } from './abstract';
import { ItemDbObject } from './items';
import { NoteDbObject } from './notes';

// Notes:
// - primary key: item_id_fk + note_id_fk
// - foreign key: item_id_fk (items.id)
// - foreign key: note_id_fk (notes.id)
// - user_id_fk is indexed
// - note_id_fk is indexed

export interface ItemNotePrimaryKey {
  item_id_fk: ID;
  note_id_fk: ID;
}

export interface ItemNoteRelationshipDbObject extends ItemNotePrimaryKey, Timestamps {}

export interface ItemNoteRelationshipRelations {
  item: ItemDbObject;
  note: NoteDbObject;
}

export interface ItemNoteRelationship
  extends ItemNoteRelationshipDbObject,
    Partial<ItemNoteRelationshipRelations> {}
