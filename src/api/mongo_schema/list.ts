import { ID, Identifiable, Time } from "./abstract";
import { Restricted } from "./social";
import { UserListItem } from "./timetable";

export type List = (UserListItem | ListItem)[];

// List item itself
export type ListItem = Identifiable &
  Time &
  Restricted &
  ItemMetadata &
  ItemSettings &
  ItemSocialData &
  ItemNotifications;

export type ItemMetadata = {
  title: string;
  type: ListItemTypes;
  status: ItemStatus;
  date?: string;
  day?: string; // For templates
  desc?: string;
  time?: string;
  end_time?: string;
  tz?: string;
  template_id?: string;
  url?: string;
  location?: string;
  show_in_upcoming?: boolean;
};

// Only modifiable by owners
export type ItemSettings = {
  suggestions_only?: boolean;
};

export type ItemSocialData = {
  suggested_changes?: SuggestedChange[];
  comments?: Comment[];
};

export type ItemNotifications = {
  notifications: ItemNotificationData[];
};

export type ItemNotificationData = {
  user_id: ID;
  minutes_before: string;
};

export type SuggestedChange = {
  data: ListItem;
  user_id: string;
  approved_by?: string[];
  dismissed_by?: string[];
};

export type Comment = {
  text: string;
  user_id: string;
  replies: Comment[];
};

export enum ListItemTypes {
  Event = "Event",
  Task = "Task",
  Item = "Item",
}

export enum ItemStatus {
  Cancelled = "Cancelled",
  Tentative = "Tentative",
  Upcoming = "Upcoming",
  InProgress = "In Progress",
  Done = "Done",
}
