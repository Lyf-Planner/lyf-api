import { DbObject, ID } from './abstract';
import { ItemDbObject } from './items';
import { UserDbObject } from './user';

// Notes:
// - primary key: user_id_fk + item_id_fk
// - foreign key: user_id_fk (users.id)
// - foreign key: item_id_fk (items.id)
// - user_id_fk + sorting_rank is indexed
// - note_id_fk is indexed
// - user_id_fk + sorting_rank is unique

export interface ItemUserRelationshipDbObject extends DbObject {
  item_id_fk: ID;
  user_id_fk: ID;
  invite_pending: boolean;
  status: ItemRelationshipStatus;
  sorting_rank: string; // string which indicates order lexicographically

  // sorting_rank and user_id are composite unique!
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
