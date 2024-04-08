import { DBObject } from "./abstract";
import { ItemUserRelationshipDbObject } from "./items_on_users";
import { NoteUserRelationshipDbObject } from "./notes_on_users";

export enum ItemType {
  Event = "Event",
  Task = "Task",
}

export enum ItemStatus {
  Cancelled = "Cancelled",
  Tentative = "Tentative",
  Upcoming = "Upcoming",
  InProgress = "In Progress",
  Done = "Done",
}

export type ItemDbObject = DBObject & {
  title: string;
  type: ItemType;
  status: ItemStatus;
  tz: string;
  date?: string;
  day?: string; // For templates
  desc?: string;
  time?: string;
  end_time?: string;
  template_id?: string;
  url?: string;
  location?: string;
  show_in_upcoming?: boolean;
  notification_mins_before?: string;
};

export type Item = ItemDbObject & {
  // Note linking
  notes: NoteUserRelationshipDbObject[];
  // Access
  users: ItemUserRelationshipDbObject[];
};
