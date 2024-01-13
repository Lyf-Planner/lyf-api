export function TwentyFourHourToAMPM(time: string) {
  var [hours, mins] = time.split(":");
  var h = parseInt(hours);
  return (h % 12 ? h % 12 : 12) + ":" + mins + (h >= 12 ? "pm" : "am");
}
