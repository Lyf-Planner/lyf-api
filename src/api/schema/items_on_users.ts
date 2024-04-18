import { DbObject, ID, Timestamps } from './abstract';
import { ItemDbObject } from './items';
import { UserDbObject } from './user';

// Notes:
// - primary key: user_id_fk + item_id_fk
// - foreign key: user_id_fk (users.id)
// - foreign key: item_id_fk (items.id)
// - user_id_fk is indexed
// - note_id_fk is indexed

export interface ItemUserRelationshipDbObject extends Timestamps {
  item_id_fk: ID;
  user_id_fk: ID;
  invite_pending: boolean;
  status: ItemRelationshipStatus;
  sorting_rank: number;
  show_in_upcoming?: boolean;
  notification_mins_before?: number;
}

export interface ItemUserRelationship extends ItemUserRelationshipDbObject {
  item: ItemDbObject;
  user: UserDbObject;
}

export enum ItemRelationshipStatus {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}
