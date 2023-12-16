import { ID, Identifiable, UserAccess } from "./abstract";

export type List = (UserListItem | ListItem)[];

// Relationship with list held by singular user
// Should only store current week and above
export type UserListItem = Identifiable & {
  data?: ListItem;
  show_in_upcoming?: boolean;
  notification?: EventNotification;
};

// List item itself
export type ListItem = Identifiable & {
  title: string;
  type: ListItemTypes;
  date?: string;
  day?: string;
  template_item?: boolean;
  desc?: string;
  time?: string;
  suggestions_only?: boolean;
  suggested_changes?: List[];
  permitted_users?: UserAccess[];
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
