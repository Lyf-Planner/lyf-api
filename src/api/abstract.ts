import { ObjectId } from "mongodb";

export type ID = ObjectId;

export type Identifiable = {
  _id: ID;
};

export type UserAccess = {
  user_id: string;
  permissions: Permission;
};

export enum Permission {
  Owner,
  Editor,
  Viewer,
}
