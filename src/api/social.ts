import { ID } from "./abstract";

// Friendships

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

// Items + notes

export type Restricted = {
  permitted_users: UserAccess[];
  invited_users?: UserAccess[];
};

export type UserAccess = {
  user_id: string;
  permissions: Permission;
};

export enum Permission {
  Owner = "Owner",
  Editor = "Editor",
  Viewer = "Viewer",
  Invitee = "Invitee",
}
