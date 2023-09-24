export type DayPlan = {
  events: String[];
  tasks: String[];
  date: Date;
};

export type Timetable = {
  Monday: DayPlan;
  Tuesday: DayPlan;
  Wednesday: DayPlan;
  Thursday: DayPlan;
  Friday: DayPlan;
  Saturday: DayPlan;
  Sunday: DayPlan;
};

export type Upcoming = {};

export type User = {
  identifier: string;
};
