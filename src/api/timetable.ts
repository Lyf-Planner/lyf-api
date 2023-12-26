import { ID, Identifiable } from "./abstract";
import { ListItem } from "./list";

export type Timetable = {
  active_template?: number;
  items: UserListItem[];
};

// Relationship with list held by singular user
// Should only store current week and above
export type UserListItem = Identifiable & {
  show_in_upcoming?: boolean;
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

// These types are used in the frontend!
export type Template = Week;

export type Week = {
  Monday: DayPlan;
  Tuesday: DayPlan;
  Wednesday: DayPlan;
  Thursday: DayPlan;
  Friday: DayPlan;
  Saturday: DayPlan;
  Sunday: DayPlan;
};

export type DayPlan = {
  day: DaysOfWeek;
  metadata?: string;
  events?: ListItem[];
  tasks?: ListItem[];
  date?: string; // Not included for Templates, uses ISO string
};

export enum DaysOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}
