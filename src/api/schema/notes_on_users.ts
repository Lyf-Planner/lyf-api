import { ID, Timestamps } from './abstract';
import { NoteDbObject } from './notes';
import { UserDbObject } from './user';

// Notes:
// - primary key: user_id_fk + note_id_fk
// - foreign key: user_id_fk (users.id)
// - foreign key: note_id_fk (notes.id)
// - user_id_fk is indexed
// - note_id_fk is indexed

export interface NoteUserRelationshipDbObject extends Timestamps {
  note_id_fk: ID;
  user_id_fk: ID;
  invite_pending: boolean;
  status: NoteRelationshipStatus;
}

export interface NoteUserRelationship extends NoteUserRelationshipDbObject {
  note: NoteDbObject;
  user: UserDbObject;
}

export enum NoteRelationshipStatus {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}
