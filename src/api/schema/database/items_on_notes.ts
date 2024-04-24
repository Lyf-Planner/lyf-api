import { ID, Timestamps } from './abstract';

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

export interface ItemNoteRelations {}

export interface ItemNoteRelationshipDbObject extends ItemNotePrimaryKey, ItemNoteRelations, Timestamps {}
