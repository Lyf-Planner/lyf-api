import { DbObject } from './abstract';
import { ID } from './abstract';
import { ItemDbObject } from './items';
import { NoteDbObject } from './notes';

// This might need review.. we'll see

export interface ItemNoteRelationshipDbObject extends DbObject {
  item_id_fk: ID;
  note_id_fk: ID;
}

export interface ItemNoteRelationship extends ItemNoteRelationshipDbObject {
  item: ItemDbObject;
  note: NoteDbObject;
}
