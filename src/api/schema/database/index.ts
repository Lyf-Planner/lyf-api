import { Identifiable } from './abstract';
import { ItemDbObject } from './items';
import { ItemNotePrimaryKey, ItemNoteRelations, ItemNoteRelationshipDbObject } from './items_on_notes';
import { ItemUserPrimaryKey, ItemUserRelations, ItemUserRelationshipDbObject } from './items_on_users';
import { NoteDbObject } from './notes';
import { NoteUserPrimaryKey, NoteUserRelations, NoteUserRelationshipDbObject } from './notes_on_users';
import { UserDbObject } from './user';
import { UserFriendshipDbObject, UserFriendshipPrimaryKey, UserFriendshipRelations } from './user_friendships';

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

export type DbPrimaryKey = keyof (Identifiable & ItemNotePrimaryKey & ItemUserPrimaryKey & NoteUserPrimaryKey & UserFriendshipPrimaryKey)

export type DbEntityObject = ItemDbObject | NoteDbObject | UserDbObject
export type DbRelationObject = ItemNoteRelationshipDbObject | ItemUserRelationshipDbObject | NoteUserRelationshipDbObject | UserFriendshipDbObject

export type DbRelationFields = ItemNoteRelations | ItemUserRelations | NoteUserRelations | UserFriendshipRelations