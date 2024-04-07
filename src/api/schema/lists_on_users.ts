import { ID } from "./abstract";

export enum ListRelationshipStatus {
  Owner = "Owner",
  Editor = "Editor",
  ReadOnly = "Read Only",
}

export type ListUserRelationshipDbObject = {
  list_id: ID;
  user_id: ID;
  invite_pending: boolean;
  status: ListRelationshipStatus;
};
