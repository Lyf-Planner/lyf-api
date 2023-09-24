import moment from "moment";

export enum DaysOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export const DaysList = Object.keys(DaysOfWeek);

export function buildTimetable(user: any) {
  console.log("Building timetable for", user.user_id);
  // Fill in anything empty
  if (!user.timetable) user.timetable = {};
  if (!user.timetable?.upcoming) user.timetable.upcoming = [];
  if (!user?.timetable?.week) {
    user.timetable.week = {};
    initialiseWeek(user.timetable.week);
  }
  if (!user?.timetable?.template) {
    user.timetable.template = {};
    initialiseWeek(user.timetable.template);
  }

  // Add stuff to the current week - template, dates etc.
  // Will do nothing if already done for this week
  buildWeek(user.timetable);
}

export function buildWeek(timetable: any) {
  // Check if stored dates are for this week
  // If not, this is the first visit of the week, and we should feed in the template
  var now = new Date();
  var start = moment(now).startOf("week").add(1, "day").toDate(); // Add a day startOf("week") starts at Sunday
  var storedStart = new Date(timetable.week?.Monday?.date);

  if (!storedStart || start.getTime() !== storedStart.getTime()) {
    timetable.week = Object.assign(timetable.template);
    mapDatesToWeek(timetable.week);
  }
}

export function initialiseWeek(week: any) {
  for (var day of DaysList) {
    week[day] = { day };
  }
}

export function mapDatesToWeek(week: any) {
  var now = new Date();
  var start = moment(now).startOf("week");
  for (var day of DaysList) {
    // Add 1 instead of i because it mutates the original - otherwise we get Fibonacci!
    week[day].date = start.add(1, "day").toDate(); // Index ahead a day as startOf("week") starts at Sunday
  }
}
