import { ID, UserAccess } from "./abstract";

export type List = (ID | ListItem)[];

// Relationship with list held by singular user
export type UserListItem = {
  id: ID;
  show_in_upcoming?: boolean;
  notification?: EventNotification;
};

// List item itself
export type ListItem = {
  id: ID;
  title: string;
  type: ListItemTypes;
  date?: string;
  day?: string;
  template_item?: boolean;
  desc?: string;
  time?: string;
  suggested_changes: List;
  permitted_users: UserAccess[];
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
