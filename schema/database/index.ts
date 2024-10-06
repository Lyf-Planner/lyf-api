import { Identifiable } from './abstract';
import { ItemDbObject } from './items';
import { ItemUserPrimaryKey, ItemUserRelations, ItemUserRelationshipDbObject } from './items_on_users';
import { NoteDbObject } from './notes';
import { NoteUserPrimaryKey, NoteUserRelations, NoteUserRelationshipDbObject } from './notes_on_users';
import { NotificationDbObject } from './notifications';
import { UserDbObject } from './user';
import { UserFriendshipDbObject, UserFriendshipPrimaryKey, UserFriendshipRelations } from './user_friendships';

// Main database interface

export interface DatabaseEntities {
  items: ItemDbObject;
  notes: NoteDbObject;
  users: UserDbObject;
  notifications: NotificationDbObject;
}
export type DbEntityObject = DatabaseEntities[keyof DatabaseEntities];

export interface DatabaseRelations {
  user_friendships: UserFriendshipDbObject;
  items_on_users: ItemUserRelationshipDbObject;
  notes_on_users: NoteUserRelationshipDbObject;
}
export type DbRelationObject = DatabaseRelations[keyof DatabaseRelations];

export type Database = DatabaseEntities & DatabaseRelations;
export type DbObject = Database[keyof Database];

// Supplementary types

export type DbPrimaryKey = keyof (Identifiable & ItemUserPrimaryKey & NoteUserPrimaryKey & UserFriendshipPrimaryKey);

export type DbRelationFields = ItemUserRelations | NoteUserRelations | UserFriendshipRelations;
