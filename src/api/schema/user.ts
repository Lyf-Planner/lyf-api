import { DbObject, ID, Timestamps } from './abstract';
import { ItemUserRelationshipDbObject } from './items_on_users';
import { NoteUserRelationshipDbObject } from './notes_on_users';
import { UserFriendshipDbObject } from './user_friendships';

// Notes:
// - primary key: id
// - user_id is indexed
// - user_id has unique constraint
// - user_id has limit of 30 chars
// - display_name has limit of 30 chars

export interface UserDbObject extends DbObject {
  user_id: string; // unique
  pass_hash: string;
  private: boolean;
  tz: string;
  expo_tokens: string[];
  first_day?: string;
  display_name?: string;
  pfp_url?: string;
  daily_notifications?: boolean;
  daily_notification_time?: string;
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: number;
};

export type User = UserDbObject & {
  relationships: UserFriendshipDbObject[];
  items: ItemUserRelationshipDbObject[];
  notes: NoteUserRelationshipDbObject[];
};

// - Id's should only be exposed to the user via their JWT token
// - pass_hash and expo_tokens should never be exposed
