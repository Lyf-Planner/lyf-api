import { ItemDbObject } from './database/items';
import { Item, ItemRelatedUser, ItemRelations } from './items';
import { Note, NoteRelatedItem, NoteRelatedUser, NoteRelations } from './notes';
import { PublicUser, User, UserFriend, UserRelatedItem, UserRelatedNote, UserRelations } from './user';

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

export type AllRelations = ItemRelations & NoteRelations & UserRelations
export type RelationKey = keyof AllRelations
export type Relation = AllRelations[RelationKey];