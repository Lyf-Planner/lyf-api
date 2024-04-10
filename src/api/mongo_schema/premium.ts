export type Premium = PremiumIndicator & {
  verification?: string; // Stripe payment key or smth
  notifications?: PremiumNotificationSettings;
};

export type PremiumIndicator = {
  enabled: boolean;
};

export type PremiumNotificationSettings = {
  daily_notifications?: boolean;
  daily_notification_time?: string;
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: string;
};
