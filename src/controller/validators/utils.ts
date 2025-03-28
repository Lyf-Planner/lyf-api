import moment from 'moment-timezone';

import { LyfError } from '../../utils/lyf_error';

export function isValidTimeZone(tz: string) {
  if (!moment.tz.zone(tz)) {
    throw new LyfError(`Unknown time zone ID: ${tz}`, 400);
  } else {
    return true;
  }
}
