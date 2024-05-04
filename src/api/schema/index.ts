import { ItemDbObject } from './database/items';
import { Item, ItemRelatedEntity, ItemRelatedUser, ItemRelations } from './items';
import { Note, NoteRelatedEntity, NoteRelatedItem, NoteRelatedUser, NoteRelations } from './notes';
import { PublicUser, User, UserFriend, UserRelatedEntity, UserRelatedItem, UserRelatedNote, UserRelations } from './user';

export interface Entities {
  user: User|PublicUser;
  item: Item;
  note: Note;
}

export type RootEntity = Entities[keyof Entities];
export type Relation = ItemRelatedEntity | NoteRelatedEntity | UserRelatedEntity

export type Entity = RootEntity | Relation
