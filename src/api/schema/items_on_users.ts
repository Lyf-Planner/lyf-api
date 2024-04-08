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
  user_id: ID;
  invite_pending: boolean;
  status: ItemRelationshipStatus;
  sorting_rank: string; // string which indicates order lexicographically

  // sorting_rank and user_id are composite unique!
};

export type ItemUserRelationship = ItemUserRelationshipDbObject & {
  item: ItemDbObject;
  user: UserDbObject;
};
