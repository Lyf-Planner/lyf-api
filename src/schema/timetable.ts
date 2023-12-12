import { List, ListItem } from "./abstract";

export type Timetable = {
  upcoming?: List;
  todo?: List;
  templates?: Template[];
  active_template?: number; // Indexes which template to use in upcoming week
  weeks?: Week[]; // Includes only weeks that have been modified by the user!
};

export type Template = Week;

export type Week = {
  Monday?: DayPlan;
  Tuesday?: DayPlan;
  Wednesday?: DayPlan;
  Thursday?: DayPlan;
  Friday?: DayPlan;
  Saturday?: DayPlan;
  Sunday?: DayPlan;
};

export type DayPlan = {
  day?: DaysOfWeek;
  metadata?: string;
  events?: Event[];
  tasks?: Task[];
  date?: string; // Not included for Templates, uses ISO string
};

export type Event = ListItem;
export type Task = ListItem;

export enum DaysOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}
