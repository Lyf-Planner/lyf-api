import { ItemDbObject } from './database/items';
import { ItemUserRelations } from './database/items_on_users';
import { UserPublicFields } from './database/user';

export interface ItemRelatedUser extends UserPublicFields, ItemUserRelations {}
export interface ItemRelatedTemplate extends ItemDbObject {}

export interface ItemRelations {
  users: ItemRelatedUser[];
  template: ItemRelatedTemplate; // if template_id present
}

export interface Item extends ItemDbObject, Partial<ItemRelations> {}
