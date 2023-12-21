import { ID, Identifiable, Restricted } from "./abstract";
import { List } from "./list";

export type Notes = {
  items: ID[];
};

export type Note = Identifiable &
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
