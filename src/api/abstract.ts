export type ID = String;

export type UserAccess = {
  user_id: ID;
  permissions: Permission;
};

export enum Permission {
  Owner,
  Editor,
  Viewer,
}
