import { Item, ItemRelatedTemplate, ItemRelatedUser } from './items';
import { Note, NoteRelatedItem, NoteRelatedUser } from './notes';
import { User, UserFriend, UserRelatedItem, UserRelatedNote } from './user';

export interface Entities {
  user: User;
  item: Item;
  note: Note;
}

export type Entity = Entities[keyof Entities];

export interface Relations {
  friendships: UserFriend[];
  userItem: UserRelatedItem[];
  userNote: UserRelatedNote[];

  itemUsers: ItemRelatedUser[];
  itemTemplate: ItemRelatedTemplate; // if template_id present

  noteUsers: NoteRelatedUser[];
  noteItems: NoteRelatedItem[];
}

export type Relation = Relations[keyof Relations];