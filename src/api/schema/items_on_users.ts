import { ID } from "./abstract";
import { ItemDbObject } from "./items";
import { UserDbObject } from "./user";

export enum ItemRelationshipStatus {
  Owner = "Owner",
  Editor = "Editor",
  ReadOnly = "Read Only",
}

export type ItemUserRelationshipDbObject = {
  item_id: ID;
  item: ItemDbObject;
  user_id: string;
  user: UserDbObject;
  invite_pending: boolean;
  type: ItemRelationshipStatus;
  notification_minutes_before?: string;
};
