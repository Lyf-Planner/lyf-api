import { ItemDbObject } from './database/items';
import { ItemUserRelations } from './database/items_on_users';
import { NoteDbObject } from './database/notes';
import { NoteUserRelations } from './database/notes_on_users';
import { UserDbObject, UserExposedFields, UserPublicFields } from './database/user';
import { UserFriendshipRelations } from './database/user_friendships';

export interface UserFriend extends UserPublicFields, UserFriendshipRelations {}
export interface UserRelatedItem extends ItemDbObject, ItemUserRelations {}
export interface UserRelatedNote extends NoteDbObject, NoteUserRelations {}

export interface UserRelations {
  friends: UserFriend[];
  items: UserRelatedItem[];
  notes: UserRelatedNote[];
}

export interface User extends UserDbObject, Partial<UserRelations> {}

