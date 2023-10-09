import { User } from "../types";
import { handleNewTimetableUser } from "./newTimetable";
import { formatDateData, getStartOfCurrentWeek, mapDatesToWeek } from "./utils";

export function buildTimetable(user: User, local_date: string) {
  console.log("Building timetable for", user.user_id);

  // Use the date string to get the date of the client - use UTC as a medium
  var year = local_date.split("-").map((x) => parseInt(x));
  var universal_date = new Date();
  universal_date.setUTCFullYear(year[0], year[1] - 1, year[2]); // -1 since we do not 0-index
  universal_date.setUTCHours(0, 0, 0, 0);
  var local_string = universal_date.toUTCString();
  console.log("Parsed local time string as", local_string);

  // Check if the user is new, give them the bare timetable data if so
  handleNewTimetableUser(user, local_string);

  // Check that zeroth indexed week is the current one
  // If not, restructure the users schedule so current week is at zero
  checkOutdatedWeek(user.timetable, local_string) &&
    rebuildWeeks(user.timetable as any, local_string);
}

export function checkOutdatedWeek(timetable: any, local_date: string) {
  // Check if stored dates at index 0 are for this week

  var start = formatDateData(new Date(getStartOfCurrentWeek(local_date)));
  var storedStart = timetable.weeks[0].Monday.date
    ? timetable.weeks[0].Monday.date // These should be stored also as UTC strings
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

export function rebuildWeeks(timetable: any, local_date: string) {
  // User's zeroth week is outdated, need to restructure

  // First, see if they have any info on the week we need.
  var weekStart = formatDateData(new Date(getStartOfCurrentWeek(local_date)));
  console.log("Rebuilding weeks with current start", weekStart);
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
    mapDatesToWeek(thisWeek, local_date);
    newWeeks.unshift(thisWeek);
    timetable.weeks = newWeeks;
  }
}
