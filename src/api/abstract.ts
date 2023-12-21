import { ObjectId } from "mongodb";

export type ID = ObjectId;

export type Identifiable = {
  _id: ID;
};

export type Restricted = {
  permitted_users: UserAccess[];
  invited_users?: string[];
};

export type UserAccess = {
  user_id: string;
  permissions: Permission;
};

export enum Permission {
  Owner = "Owner",
  Editor = "Editor",
  Viewer = "Viewer",
}
