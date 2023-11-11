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
  verification: string; // Stripe payment key or smth
  enabled: boolean;
  settings: PremiumFeatureSettings;
};

export type PremiumFeatureSettings = {
  daily_notifications: boolean;
  event_notifications: boolean;
  mfa: boolean; 
};

