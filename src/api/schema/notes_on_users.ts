import { DBObject, ID } from "./abstract";
import { NoteDbObject } from "./notes";
import { UserDbObject } from "./user";

export enum NoteRelationshipStatus {
  Owner = "Owner",
  Editor = "Editor",
  ReadOnly = "Read Only",
}

export type NoteUserRelationshipDbObject = DBObject & {
  note_id: ID;
  user_id: ID;
  invite_pending: boolean;
  status: NoteRelationshipStatus;
};

export type NoteUserRelationship = NoteUserRelationshipDbObject & {
  note: NoteDbObject;
  user: UserDbObject;
};
