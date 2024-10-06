import { ID, Timestamps } from './abstract';

// Notes:
// - primary key: user_id_fk + item_id_fk
// - foreign key: user_id_fk (users.id)
// - foreign key: item_id_fk (items.id)
// - user_id_fk is indexed
// - note_id_fk is indexed

export interface ItemUserPrimaryKey {
  item_id_fk: ID;
  user_id_fk: ID;
}

export interface ItemUserRelations {
  invite_pending: boolean;
  permission: Permission;
  sorting_rank: number;
  show_in_upcoming: boolean | undefined;
  notification_mins: number | undefined;
}

export interface ItemUserRelationshipDbObject
  extends Timestamps,
    ItemUserPrimaryKey,
    ItemUserRelations {}

// Enums

export enum Permission {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}
