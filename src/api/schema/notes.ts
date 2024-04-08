import { DBObject } from "./abstract";
import { ItemNoteRelationshipDbObject } from "./items_on_notes";
import { NoteUserRelationshipDbObject } from "./notes_on_users";

export enum NoteType {
  ListOnly = "List Only",
  NoteOnly = "Note Only",
  Multiple = "Multiple",
}

export type NoteDbObject = DBObject & {
  title: string;
  type: NoteType;
  content?: string;
};

export type Note = NoteDbObject & {
  items: ItemNoteRelationshipDbObject[];
  users: NoteUserRelationshipDbObject[];
};
