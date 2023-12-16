import { ID } from "./abstract";
import { ListItem, UserListItem } from "./list";

export type Timetable = {
  active_template?: number;
  items: UserListItem[];
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
