import { ID, Identifiable, Restricted, Time } from "./abstract";

export type List = (UserListItem | ListItem)[];

// Relationship with list held by singular user
// Should only store current week and above
export type UserListItem = Identifiable & {
  show_in_upcoming?: boolean;
  notification?: EventNotification;
};

// List item itself
export type ListItem = Identifiable &
  Time &
  Restricted &
  ItemMetadata &
  ItemSettings &
  ItemSocialData;

export type ItemMetadata = {
  title: string;
  type: ListItemTypes;
  date?: string;
  day?: string; // For templates
  desc?: string;
  time?: string;
};

// Only modifiable by owners
export type ItemSettings = {
  template_item?: boolean;
  suggestions_only?: boolean;
};

export type ItemSocialData = {
  suggested_changes?: SuggestedChange[];
  comments?: Comment[];
};

export type SuggestedChange = {
  data: ListItem;
  user_id: string;
  vote?: boolean;
  approved_by?: string[];
  dismissed_by?: string[];
};

export type Comment = {
  text: string;
  user_id: string;
  tags: string[];
};

export type ListItemInput = {
  title: string;
  type: ListItemTypes;
  created?: Date;
  date?: string;
  day?: string; // For templates
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
