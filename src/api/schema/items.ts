import { Identifiable, Timestamps } from "./abstract";
import { ItemUserRelationshipDbObject } from "./items_on_users";
import { ListUserRelationshipDbObject } from "./lists_on_users";

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

export type ItemDbObject = Identifiable &
  Timestamps & {
    title: string;
    type: ItemType;
    status: ItemStatus;
    timezone: string;
    date?: string;
    day?: string; // For templates
    desc?: string;
    time?: string;
    end_time?: string;
    template_id?: string;
    url?: string;
    location?: string;
    show_in_upcoming?: boolean;
    // Note linking
    hide_from_timetable?: boolean;
    lists: ListUserRelationshipDbObject[];
    // Access
    users: ItemUserRelationshipDbObject[];
  };
