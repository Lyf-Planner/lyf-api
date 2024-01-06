// import moment from "moment";

// export enum DaysOfWeek {
//   Monday = "Monday",
//   Tuesday = "Tuesday",
//   Wednesday = "Wednesday",
//   Thursday = "Thursday",
//   Friday = "Friday",
//   Saturday = "Saturday",
//   Sunday = "Sunday",
// }

// export const DaysList = Object.keys(DaysOfWeek);

// export function initialiseWeek(week: any) {
//   for (var day of DaysList) {
//     week[day] = { day };
//   }
//   return week;
// }

// export function getStartOfCurrentWeek(date: string) {
//   // This sets the first day of the week to Monday. For some reason not a default
//   moment.updateLocale("en", {
//     week: {
//       dow: 1,
//     },
//   });

//   var start = moment(date).utc(false).startOf("week").toDate().toUTCString();
//   return start;
// }

// export function mapDatesToWeek(week: any, local_date: string) {
//   // First day of week is Monday
//   moment.updateLocale("en", {
//     week: {
//       dow: 1,
//     },
//   });

//   for (var i in DaysList) {
//     var start = moment(getStartOfCurrentWeek(local_date)).utc(false);
//     var next = start.add(i, "days").toDate();

//     week[DaysList[i]].date = `${next.getUTCFullYear()}-${
//       next.getUTCMonth() + 1
//     }-${next.getUTCDate()}`;
//   }
// }

// export function formatDateData(date: Date) {
//   return `${date.getUTCFullYear()}-${date.getUTCMonth()+1}-${date.getUTCDate()}`;
// }
