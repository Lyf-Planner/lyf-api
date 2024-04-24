import { Timestamps } from './abstract';

// Notes:
// - primary key: user_id
// - user_id is indexed
// - user_id has unique constraint
// - user_id has limit of 30 chars
// - display_name has limit of 30 chars

export type UserID = string;

export interface UserPrimaryKey {
  user_id: UserID;
}

export interface UserPublicFields extends UserPrimaryKey, Timestamps {
  display_name?: string;
  pfp_url?: string;
}

export interface UserExposedFields extends UserPublicFields {
  private: boolean;
  tz: string;
  first_day?: string;
  daily_notifications?: boolean;
  daily_notification_time?: string; // hh:mm
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: number;
}

export interface UserSensitiveFields {
  pass_hash: string;
  expo_tokens: string[];
}

export interface UserDbObject extends UserExposedFields, UserSensitiveFields {}
