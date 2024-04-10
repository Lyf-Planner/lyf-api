import { ID, Identifiable } from './abstract';
import { ListItem } from './list';

export type Timetable = {
  active_template?: number;
  first_day?: string;
  items: UserListItem[];
  invited_items?: ID[];
};

// Relationship with list held by singular user
// Should only store current week and above
export type UserListItem = Identifiable & {
  show_in_upcoming?: boolean;
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
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday'
}
