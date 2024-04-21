import { DbObject } from './abstract';
import { ItemNoteRelationshipDbObject } from './items_on_notes';
import { NoteUserRelationshipDbObject } from './notes_on_users';

// Notes:
// - primary key: id
// - title has limit of 80 chars

export interface NoteDbObject extends DbObject {
  title: string;
  type: NoteType;
  content?: string;
}

export interface NoteRelations {
  items: ItemNoteRelationshipDbObject[];
  users: NoteUserRelationshipDbObject[];
}

export interface Note extends NoteDbObject, Partial<NoteRelations> {}

export enum NoteType {
  ListOnly = 'List Only',
  NoteOnly = 'Note Only',
  Multiple = 'Multiple'
}
