import { ItemDbObject } from './database/items';
import { ItemUserRelations } from './database/items_on_users';
import { NoteDbObject } from './database/notes';
import { NoteUserRelations } from './database/notes_on_users';
import { UserDbObject, UserPublicFields } from './database/user';
import { UserFriendshipRelations } from './database/user_friendships';
import { Item } from './items';
import { Note } from './notes';

export interface UserFriend extends UserPublicFields, UserFriendshipRelations {}
export interface UserRelatedItem extends Item, ItemUserRelations {}
export interface UserRelatedNote extends Note, NoteUserRelations {}

export interface UserRelations {
  friends: UserFriend[];
  items: UserRelatedItem[];
  notes: UserRelatedNote[];
}

export interface User extends UserDbObject, Partial<UserRelations> {}
export interface PublicUser extends UserPublicFields, Partial<UserRelations> {}

