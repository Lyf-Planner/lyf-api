import { ID, List } from "./abstract";

export type Notes = {
  items: (ID | Note)[];
};
export type Note = {
  id: ID;
  type?: NoteType;
  title: string;
  content: NoteContent;
};

export enum NoteType {
  List = "List",
  Text = "Text", // These are often just referred to as Notes - they are the default
}

export type NoteContent = List | string;
