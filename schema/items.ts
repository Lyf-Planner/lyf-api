import { ItemDbObject } from './database/items';
import { ItemUserRelations } from './database/items_on_users';
import { PublicUser, UserRelatedItem } from './user';

export interface ItemRelatedUser extends PublicUser, ItemUserRelations {}
export interface TemplateItem extends Item {}

export type ItemRelatedEntity = ItemRelatedUser | TemplateItem;

export interface ItemRelations {
  users: ItemRelatedUser[];
  items: TemplateItem; // if template_id present
}

export interface Item extends ItemDbObject {
  relations: Partial<ItemRelations>;
}

// Used by the frontend to create standing copies of template items
export interface LocalItem extends UserRelatedItem {
  localised: boolean
}
