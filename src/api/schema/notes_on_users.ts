import { DbObject, ID } from './abstract';
import { NoteDbObject } from './notes';
import { UserDbObject } from './user';

export enum NoteRelationshipStatus {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}

export interface NoteUserRelationshipDbObject extends DbObject {
  note_id_fk: ID;
  user_id_fk: ID;
  invite_pending: boolean;
  status: NoteRelationshipStatus;
};

export interface NoteUserRelationship extends NoteUserRelationshipDbObject {
  note: NoteDbObject;
  user: UserDbObject;
};
