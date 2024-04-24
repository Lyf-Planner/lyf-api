import { ItemDbObject } from './database/items';
import { Item, ItemRelatedUser } from './items';
import { Note, NoteRelatedItem, NoteRelatedUser } from './notes';
import { PublicUser, User, UserFriend, UserRelatedItem, UserRelatedNote } from './user';

export interface Entities {
  user: User|PublicUser;
  item: Item;
  note: Note;
}

export type Entity = Entities[keyof Entities];

export interface Relations {
  friendships: UserFriend;
  userItem: UserRelatedItem;
  userNote: UserRelatedNote;

  itemUsers: ItemRelatedUser;
  itemTemplate: ItemDbObject; // if template_id present

  noteUsers: NoteRelatedUser;
  noteItems: NoteRelatedItem;
}

export type Relation = Relations[keyof Relations];