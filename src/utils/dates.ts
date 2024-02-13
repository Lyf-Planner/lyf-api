import moment from "moment-timezone";

export function TwentyFourHourToAMPM(time: string) {
  var [hours, mins] = time.split(":");
  var h = parseInt(hours);
  return (h % 12 ? h % 12 : 12) + ":" + mins + (h >= 12 ? "pm" : "am");
}

export function formatDateData(date: Date) {
  return moment(date).format("YYYY-MM-DD");
}

export function parseDateString(date: String) {
  var data = date.split("-").map((x) => parseInt(x));
  return new Date(data[0], data[1] - 1, data[2]);
}

export function formatDate(date: string) {
  var time = parseDateString(date);
  return moment(time).format("MMM D");
}
