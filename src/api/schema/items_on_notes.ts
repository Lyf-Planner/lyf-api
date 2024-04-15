import { DbObject, Timestamps } from './abstract';
import { ID } from './abstract';
import { ItemDbObject } from './items';
import { NoteDbObject } from './notes';

// Notes:
// - primary key: item_id_fk + note_id_fk
// - foreign key: item_id_fk (items.id)
// - foreign key: note_id_fk (notes.id)
// - user_id_fk is indexed
// - note_id_fk is indexed

export interface ItemNoteRelationshipDbObject extends Timestamps {
  item_id_fk: ID;
  note_id_fk: ID;
}

export interface ItemNoteRelationship extends ItemNoteRelationshipDbObject {
  item: ItemDbObject;
  note: NoteDbObject;
}
