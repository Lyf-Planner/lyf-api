import { checkExact } from 'express-validator';
import moment from 'moment-timezone';

export function isValidTimeZone(tz: string) {
  if (!moment.tz.zone(tz)) {
    throw new Error('Unknown time zone ID: ' + tz);
  } else {
    return true;
  }
}

export function validator(valChain: any) {
  // Common operations for all validators - acts as wrapper
  return checkExact(valChain);
}
