import { DateString } from '../util/dates';
import { DbEntry } from './abstract';

// Notes:
// - primary key: id
// - id has limit of 30 chars
// - display_name has limit of 30 chars
// - first day is a date string, 10 chars

export interface UserPublicFields extends DbEntry {
  display_name: string | undefined;
  pfp_url: string | undefined;
}

export interface UserExposedFields extends UserPublicFields {
  daily_notification_time: string | undefined; // hh:mm
  event_notification_mins: number | undefined;
  persistent_daily_notification: boolean | undefined;
  first_day: DateString | undefined;
  private: boolean;
  tz: string;
  weather_data: boolean | undefined;
  auto_day_finishing: boolean | undefined;
}

export interface UserSensitiveFields {
  expo_tokens: string[];
  pass_hash: string;
}

export interface UserDbObject extends UserExposedFields, UserSensitiveFields {}
