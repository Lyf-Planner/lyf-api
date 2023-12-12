import { ObjectId } from "mongodb";

export type ID = ObjectId;

export type List = ListItem[];

export type ListItem = {
  id: ID;
  title: string;
  date?: string;
  desc?: string;
  time?: string;
  notify?: boolean;
  minutes_before?: string;
  type?: ListItemTypes;
};

export enum ListItemTypes {
  Event = "Event",
  Task = "Task",
  Item = "Item",
}
