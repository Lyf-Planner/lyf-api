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

export function initialiseWeek(week: any) {
  for (var day of DaysList) {
    week[day] = { day };
  }
  return week;
}

export function getStartOfCurrentWeek() {
  var now = new Date();

  // This sets the first day of the week to Monday. For some reason not a default
  moment.updateLocale("en", {
    week: {
      dow: 1,
    },
  });

  return moment(now).startOf("week").toDate().toISOString();
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
