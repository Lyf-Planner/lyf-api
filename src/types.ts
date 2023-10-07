export type User = {
  user_id: string;
  timetable?: Timetable;
};

export type Timetable = {
  upcoming?: string[];
  todo?: string[];
  templates?: Template[];
  active_template?: number; // Indexes which template to use in upcoming week
  weeks?: Week[]; // Includes only weeks that have been modified by the user!
};

export type Upcoming = Event[];

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

export type Event = string;
export type Task = string;

export enum DaysOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}
