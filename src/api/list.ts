import { ID, Identifiable, Restricted, Time } from "./abstract";
import { UserListItem } from "./timetable";

export type List = (UserListItem | ListItem)[];

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
  status: ItemStatus;
  date?: string;
  day?: string; // For templates
  desc?: string;
  time?: string;
  template_id?: string;
};

// Only modifiable by owners
export type ItemSettings = {
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
