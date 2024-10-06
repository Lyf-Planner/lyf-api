import { DbEntry } from './abstract';

// Notes:
// - primary key: id
// - title has limit of 80 chars

export interface NoteDbObject extends DbEntry {
  title: string;
  type: NoteType;
  collaborative: boolean;
  content: string | undefined;
}

export interface NoteSensitiveFields {}

// Enums

export enum NoteType {
  ListOnly = 'List Only',
  NoteOnly = 'Note Only',
  Multiple = 'Multiple'
}
