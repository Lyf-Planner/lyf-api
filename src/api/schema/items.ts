import { ItemDbObject } from './database/items';
import { ItemUserRelations } from './database/items_on_users';
import { PublicUser } from './user';

export interface ItemRelatedUser extends PublicUser, ItemUserRelations {}

export interface ItemRelations {
  users: ItemRelatedUser[];
  template?: Item; // if template_id present
}

export interface Item extends ItemDbObject, Partial<ItemRelations> {}
