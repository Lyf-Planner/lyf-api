import { DBObject, ID } from './abstract';
import { ItemDbObject } from './items';
import { NoteDbObject } from './notes';

// This might need review.. we'll see

export type ItemNoteRelationshipDbObject = DBObject & {
  item_id: ID;
  note_id: ID;
};

export type ItemNoteRelationship = ItemNoteRelationshipDbObject & {
  item: ItemDbObject;
  note: NoteDbObject;
};
