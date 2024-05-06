import { ItemDbObject } from './items';
import { ItemNoteRelations, ItemNoteRelationshipDbObject } from './items_on_notes';
import { ItemUserRelations, ItemUserRelationshipDbObject } from './items_on_users';
import { NoteDbObject } from './notes';
import { NoteUserRelations, NoteUserRelationshipDbObject } from './notes_on_users';
import { UserDbObject } from './user';
import { UserFriendshipDbObject, UserFriendshipRelations } from './user_friendships';

export interface Database {
  users: UserDbObject;
  user_friendships: UserFriendshipDbObject;
  items: ItemDbObject;
  notes: NoteDbObject;
  items_on_notes: ItemNoteRelationshipDbObject;
  items_on_users: ItemUserRelationshipDbObject;
  notes_on_users: NoteUserRelationshipDbObject;
}

export type DbObject = Database[keyof Database];

export type DbBaseObject = ItemDbObject | NoteDbObject | UserDbObject
export type DbRelationFields = ItemNoteRelations | ItemUserRelations | NoteUserRelations | UserFriendshipRelations