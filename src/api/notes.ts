import { ID, Identifiable, Restricted, Time } from "./abstract";
import { List } from "./list";

export type Notes = {
  items: string[];
};

export type Note = Identifiable &
  Time &
  Restricted & {
    type: NoteType;
    title: string;
    content: NoteContent;
  };

export type NoteInput = {
  type: NoteType;
  title: string;
};

export enum NoteType {
  List = "List",
  Text = "Text", // These are often just referred to as Notes - they are the default
}

export type NoteContent = List | string;
