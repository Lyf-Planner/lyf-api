import { ID, Timestamps } from './abstract';
import { NoteDbObject } from './notes';
import { UserDbObject } from './user';

// Notes:
// - primary key: user_id_fk + note_id_fk
// - foreign key: user_id_fk (users.id)
// - foreign key: note_id_fk (notes.id)
// - user_id_fk is indexed
// - note_id_fk is indexed

export interface NoteUserPrimaryKey {
  note_id_fk: ID;
  user_id_fk: ID;
}

export interface NoteUserRelationshipDbObject extends NoteUserPrimaryKey, Timestamps {
  invite_pending: boolean;
  status: NoteRelationshipStatus;
}

export interface NoteUserRelationshipRelations {
  note: NoteDbObject;
  user: UserDbObject;
}

export interface NoteUserRelationship
  extends NoteUserRelationshipDbObject,
    Partial<NoteUserRelationshipRelations> {}

export enum NoteRelationshipStatus {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}
