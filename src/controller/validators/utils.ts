import { checkExact } from 'express-validator';
import moment from 'moment-timezone';
import { LyfError } from '../../utils/lyf_error';

export function isValidTimeZone(tz: string) {
  if (!moment.tz.zone(tz)) {
    throw new LyfError('Unknown time zone ID: ' + tz, 400);
  } else {
    return true;
  }
}

export function validator(valChain: any) {
  // Common operations for all validators - acts as wrapper
  return checkExact(valChain);
}
