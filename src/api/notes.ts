import { ID } from "./abstract";
import { List } from "./list";

export type Notes = {
  items: Note[];
};

export type Note = {
  id: ID;
  type: NoteType;
  title: string;
  content: NoteContent;
};

export enum NoteType {
  List = "List",
  Text = "Text", // These are often just referred to as Notes - they are the default
}

export type NoteContent = List | string;
