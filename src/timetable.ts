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

  // This sets the first day of the week to Monday. For some reason not a default
  moment.updateLocale("en", {
    week: {
      dow: 1,
    },
  });

  var start = moment(now).startOf("week").toDate().toISOString();
  var storedStart = timetable.week?.Monday?.date ? new Date(timetable.week.Monday.date).toISOString() : null;

  if (!storedStart || start !== storedStart) {
    console.log(
      "Refreshing timetable - week was detected as old: Monday was",
      storedStart,
      start
    );
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

  // First day of week is Monday
  moment.updateLocale("en", {
    week: {
      dow: 1,
    },
  });

  for (var i in DaysList) {
    var start = moment(now).startOf("week");
    week[DaysList[i]].date = start.add(i, "days").toDate().toISOString();
  }
}
