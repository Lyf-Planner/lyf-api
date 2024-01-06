export type ID = string;

export type DBObject = Identifiable & Time;

export type Identifiable = {
  id: ID;
};

export type Time = {
  created: Date;
  last_updated: Date;
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
