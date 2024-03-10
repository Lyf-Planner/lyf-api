import { ID } from "./abstract";

// Friendships

export enum FriendshipAction {
  Remove = "Remove",
  Accept = "Accept",
  Decline = "Decline",
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
  invited_users: UserAccess[];
};

export type UserAccess = {
  user_id: string;
  displayed_as: string;
  permissions: Permission;
};

export enum SocialAction {
  Invite = "Invite",
  Cancel = "Cancel",
  Accept = "Accept",
  Decline = "Decline",
  Remove = "Remove",
}

export enum Permission {
  Owner = "Owner",
  Editor = "Editor",
  Viewer = "Viewer",
  Invited = "Invited",
}
