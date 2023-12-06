import { Notes } from "./notes";
import { Timetable } from "./timetable";

export type User = {
  user_id: string;
  pass_hash: string;
  timetable?: Timetable;
  notes?: Notes;
  premium?: Premium;
};

export type Premium = {
  verification?: string; // Stripe payment key or smth
  enabled?: boolean;
  notifications?: PremiumNotificationSettings;
};

export type PremiumNotificationSettings = {
  daily_notifications?: boolean;
  daily_notification_time?: string;
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: string;
  event_notifications?: EventNotification[];
  notification_token?: string;
};

export type EventNotification = {
  item_id: string;
  event_name: string;
  event_datetime: Date;
  minutes_away: string;
  scheduled_for?: Date;
  to?: string;
};
