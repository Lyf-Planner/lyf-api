import moment from "moment";

import { Timetable, User } from "../types";
import { handleNewTimetableUser } from "./newTimetable";
import { getStartOfCurrentWeek, initialiseWeek, mapDatesToWeek } from "./utils";

export function buildTimetable(user: User) {
  console.log("Building timetable for", user.user_id);
  // Check if the user is new, give them the bare timetable data if so
  handleNewTimetableUser(user);

  // Check that zeroth indexed week is the current one
  // If not, restructure the users schedule so current week is at zero
  checkOutdatedWeek(user.timetable) && rebuildWeeks(user.timetable as any);
}

export function checkOutdatedWeek(timetable: any) {
  // Check if stored dates at index 0 are for this week

  var start = getStartOfCurrentWeek();
  var storedStart = timetable.weeks[0].Monday.date
    ? new Date(timetable.weeks[0].Monday.date).toISOString()
    : null;

  const isOutdated = !storedStart || start !== storedStart;
  isOutdated &&
    console.log(
      "Refreshing timetable - week was detected as old: Monday was",
      storedStart,
      start
    );

  return isOutdated;
}

export function rebuildWeeks(timetable: any) {
  // User's zeroth week is outdated, need to restructure

  // First, see if they have any info on the week we need.
  var weekStart = getStartOfCurrentWeek();
  var currentWeekIndex = timetable.weeks?.findIndex(
    (week: any) => week.Monday!.date === weekStart
  );

  // If they do, just shift to that
  if (currentWeekIndex !== -1) {
    timetable.weeks = timetable.weeks?.slice(currentWeekIndex);
  } else {
    // Otherwise remove every week prior to current, add current week to start of array
    var newWeeks = timetable.weeks!.filter(
      (week: any) => new Date(week.Monday!.date!) > new Date(weekStart)
    );
    var thisWeek = Object.assign({}, timetable.templates[0]);
    mapDatesToWeek(thisWeek);
    newWeeks.unshift(thisWeek);
    timetable.weeks = newWeeks;
  }
}
