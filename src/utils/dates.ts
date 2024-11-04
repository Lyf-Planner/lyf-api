import moment from 'moment-timezone';

import { LyfError } from './lyf_error';
import { DateString } from '../../schema/util/dates';

const oneSecond = 1000;
const oneMinute = oneSecond * 60;
const oneHour = oneMinute * 60;
const oneDay = oneHour * 24;

export const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function TwentyFourHourToAMPM(time: string) {
  const [hours, mins] = time.split(':');
  const h = parseInt(hours);
  return (h % 12 ? h % 12 : 12) + ':' + mins + (h >= 12 ? 'pm' : 'am');
}

export function formatDateData(date: Date) {
  return moment(date).format('YYYY-MM-DD');
}

export function getDayFromDate(date: Date) {
  return moment(date).format('dddd');
}

export function parseDateString(date: String) {
  const data = date.split('-').map((x) => parseInt(x));
  return new Date(data[0], data[1] - 1, data[2]);
}

export function formatDate(date: string) {
  const time = parseDateString(date);
  return moment(time).format('MMM D');
}

export function isFutureDate(date: Date, timezone: string) {
    const localTime = moment().tz(timezone).toDate();

    return localTime < date;
}

export const daysDifferenceBetween = (start: DateString, end: DateString) => {
  const a = moment(start);
  const b = moment(end);
  // Add 1 <==> inclusive of the end
  return b.diff(a, 'days') + 1;
}

export const allDatesBetween = (start: DateString, end: DateString, excludeFinal = false) => {
  // Note: is inclusive of both start and end date

  if (end.localeCompare(start) < 0) { 
    return [];
  }

  let dates: string[] = [];
  let shiftingDate = start;
  while (shiftingDate.localeCompare(end) <= 0) {
    dates.push(shiftingDate);
    shiftingDate = formatDateData(moment(shiftingDate).add(1, 'day').toDate());
  }

  return excludeFinal ? dates.slice(0,-1) : dates;
}

export function daysInRange(start: string, end: string) {
  const startDate = parseDateString(start);
  const endDate = parseDateString(end);

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
  const days = [];
  while (dayIterator.getTime() <= endDate.getTime()) {
    days.push(getDayFromDate(dayIterator));
    dayIterator = moment(dayIterator).add(1, 'day').toDate();
  }

  return days;
}

export function getStartOfCurrentWeek(tz: string) {
  const now = new Date();

  // This sets the first day of the week to Monday. For some reason not a default
  moment.updateLocale('en', {
    week: {
      dow: 1
    }
  });

  const start = moment(now)
    .tz(tz)
    .startOf('week')
    .toDate()
    .setHours(0, 0, 0, 0);
  return new Date(start);
}