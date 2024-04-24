import { DbObject } from './abstract';

// Notes:
// - primary key: id
// - title has limit of 80 chars

export interface NoteDbObject extends DbObject {
  title: string;
  type: NoteType;
  content?: string;
}

export interface NoteSensitiveFields {}

// Enums

export enum NoteType {
  ListOnly = 'List Only',
  NoteOnly = 'Note Only',
  Multiple = 'Multiple'
}
