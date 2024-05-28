import moment from 'moment-timezone';
import { LyfError } from './lyf_error';

const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function TwentyFourHourToAMPM(time: string) {
  var [hours, mins] = time.split(':');
  var h = parseInt(hours);
  return (h % 12 ? h % 12 : 12) + ':' + mins + (h >= 12 ? 'pm' : 'am');
}

export function formatDateData(date: Date) {
  return moment(date).format('YYYY-MM-DD');
}

export function getDayFromDate(date: Date) {
  return moment(date).format('dddd');
}

export function parseDateString(date: String) {
  var data = date.split('-').map((x) => parseInt(x));
  return new Date(data[0], data[1] - 1, data[2]);
}

export function formatDate(date: string) {
  var time = parseDateString(date);
  return moment(time).format('MMM D');
}

export function isFutureDate(date: Date, timezone: string) {
    const localTime = moment().tz(timezone).toDate();
    
    return localTime < date;
}

export function daysInRange(start: string, end: string) {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end)

  if (startDate.getTime() > endDate.getTime()) {
    throw new LyfError('Invalid order entered to daysInRange util', 500);
  }

  const diffMillis = endDate.getTime() - startDate.getTime();

  // Anything more than 6 can just return every day
  if (diffMillis > 6 * oneDay) {
    return daysOfWeek;
  }

  // Else find the combination of days
  let dayIterator = startDate;
  let days = [];
  while (dayIterator.getTime() <= endDate.getTime()) {
    days.push(getDayFromDate(dayIterator))
    dayIterator = moment(dayIterator).add(1, 'day').toDate();
  }

  return days;
}