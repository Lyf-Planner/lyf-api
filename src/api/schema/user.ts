import { DBObject } from "./abstract";
import { ItemUserRelationshipDbObject } from "./items_on_users";
import { ListUserRelationshipDbObject } from "./lists_on_users";
import { UserRelationshipDbObject } from "./users_on_users";

export type UserDbObject = DBObject & {
  // User metadata
  user_id: string; // unique constraint
  pass_hash: string;
  private: boolean;
  timezone: string;
  expo_tokens: string[];
  display_name?: string;
  pfp_url?: string;
  // Settings and preferences
  daily_notifications?: boolean;
  daily_notification_time?: string;
  persistent_daily_notification?: boolean;
  event_notifications_enabled?: boolean;
  event_notification_minutes_before?: string;
  // Relationships
  relationships: UserRelationshipDbObject[];
  // Items
  items: ItemUserRelationshipDbObject[];
  // Lists
  lists: ListUserRelationshipDbObject[];
};
