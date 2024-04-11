import { ID, DbObject } from './abstract';
import { ItemDbObject } from './items';
import { UserDbObject } from './user';

export enum ItemRelationshipStatus {
  Owner = 'Owner',
  Editor = 'Editor',
  ReadOnly = 'Read Only'
}

export interface ItemUserRelationshipDbObject extends DbObject {
  item_id_fk: ID;
  user_id_fk: ID;
  invite_pending: boolean;
  status: ItemRelationshipStatus;
  sorting_rank: string; // string which indicates order lexicographically

  // sorting_rank and user_id are composite unique!
};

export interface ItemUserRelationship extends ItemUserRelationshipDbObject {
  item: ItemDbObject;
  user: UserDbObject;
};
