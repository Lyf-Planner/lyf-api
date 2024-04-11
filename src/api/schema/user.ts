import { Timestamps } from './abstract';
import { ItemUserRelationshipDbObject } from './items_on_users';
import { NoteUserRelationshipDbObject } from './notes_on_users';
import { UserRelationshipDbObject } from './users_on_users';

export interface UserDbObject extends Timestamps {
  // User metadata
  user_id: string; // primary key!
  pass_hash: string; // not exported
  private: boolean;
  tz: string;
  expo_tokens: string[]; // not exported
  display_name?: string;
  pfp_url?: string;
  // Settings and preferences
  daily_notifications?: boolean;
  daily_notification_time?: string;
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: string;
};

export type User = UserDbObject & {
  relationships: UserRelationshipDbObject[];
  items: ItemUserRelationshipDbObject[];
  notes: NoteUserRelationshipDbObject[];
};
