import { ID, Identifiable, UserAccess } from "./abstract";
import { List } from "./list";

export type Notes = {
  items: (ID | Note)[];
};

export type Note = Identifiable & {
  type: NoteType;
  title: string;
  content: NoteContent;
  permitted_users: UserAccess[];
};

export enum NoteType {
  List = "List",
  Text = "Text", // These are often just referred to as Notes - they are the default
}

export type NoteContent = List | string;
