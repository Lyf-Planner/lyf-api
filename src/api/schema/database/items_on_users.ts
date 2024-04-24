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
  permission: ItemUserPermission;
  sorting_rank: number;
  show_in_upcoming?: boolean;
  notification_mins_before?: number;
}

export interface ItemUserRelationshipDbObject
  extends Timestamps,
    ItemUserPrimaryKey,
    ItemUserRelations {}

// Enums

export enum ItemUserPermission {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}
