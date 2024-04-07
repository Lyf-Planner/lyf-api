import { ID, DBObject } from "./abstract";
import { ItemDbObject } from "./items";
import { UserDbObject } from "./user";

export enum ItemRelationshipStatus {
  Owner = "Owner",
  Editor = "Editor",
  ReadOnly = "Read Only",
}

export type ItemUserRelationshipDbObject = DBObject & {
  item_id: ID;
  item: ItemDbObject;
  user_id: ID;
  user: UserDbObject;
  invite_pending: boolean;
  status: ItemRelationshipStatus;
};
