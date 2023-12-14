import { ID } from "./abstract";

export type List = ListItem[];

export type ListItem = {
  id: ID;
  title: string;
  type: ListItemTypes;
  date?: string;
  desc?: string;
  time?: string;
  notify?: boolean;
  show_in_upcoming?: boolean;
  minutes_before?: string;
  notification?: EventNotification;
};

export type EventNotification = {
  item_id: ID;
  event_name: string;
  event_datetime: Date;
  minutes_away: string;
  scheduled_for: Date;
  to: string;
};

export enum ListItemTypes {
  Event = "Event",
  Task = "Task",
  Item = "Item",
}
