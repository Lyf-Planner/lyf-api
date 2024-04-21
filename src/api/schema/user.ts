import { DbObject, Timestamps } from './abstract';
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
  daily_notification_time?: string; // hh:mm
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: number;
}

export interface UserRelations {
  friendships: UserFriendshipDbObject[];
  items: ItemUserRelationshipDbObject[];
  notes: NoteUserRelationshipDbObject[];
}

export interface User extends UserDbObject, Partial<UserRelations> {}

// Fields on a user returned to other users - don't expose their ID
export interface ExternalUserSerialized extends Timestamps {
  user_id: string;
  tz: string;
  display_name?: string;
  pfp_url?: string;
  friendships?: UserFriendshipDbObject[];
}

export interface UserBackendOnlyFields {
  pass_hash: string;
  expo_tokens: string[];
}

// Fields on a user returned to themselves
export interface UserSerialized extends Omit<User, keyof UserBackendOnlyFields> {}
