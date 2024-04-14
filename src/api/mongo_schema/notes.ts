import { Identifiable, ID, Time } from './abstract';
import { List } from './list';
import { Restricted } from './social';

export type Notes = {
  items: (UserNote | Note)[];
  invited_items: ID[];
};

// Relationship
export type UserNote = {
  id: ID;
};

export type Note = Identifiable &
  Time &
  Restricted & {
    type: NoteType;
    title: string;
    content: NoteContent;
  };

export enum NoteType {
  List = 'List',
  Text = 'Text' // These are often just referred to as Notes - they are the default
}

export type NoteContent = List | string;
