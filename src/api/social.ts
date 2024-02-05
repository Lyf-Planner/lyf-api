import { ID } from "./abstract";

export enum FriendshipAction {
  Remove = "Remove",
  Accept = "Accept",
  Deny = "Deny",
  Request = "Request",
  Cancel = "Cancel",
}

export type FriendshipUpdate = {
  user_id: ID;
  action: FriendshipAction;
};
