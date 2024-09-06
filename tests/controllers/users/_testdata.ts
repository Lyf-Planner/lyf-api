export const testUserCredentials = {
  user_id: 'test_user',
  password: 'password',
  tz: 'America/New York'
};

export const testUserPassHash = { pass_hash: '' };

export const testUser = { ...testUserCredentials, ...testUserPassHash };

export const exportedTestUser = {
  created: expect.any(Date),
  last_updated: expect.any(Date),
  user_id: 'test_user',
  tz: 'America/New York',
  private: false,
  display_name: null,
  pfp_url: null,
  // Settings and preferences
  daily_notifications: false,
  daily_notification_time: '08:00',
  persistent_daily_notification: false,
  event_notifications_enabled: true,
  event_notification_minutes_before: '5',
  // Relationships
  relationships: [],
  // Items
  items: [],
  // Lists
  lists: []
};
