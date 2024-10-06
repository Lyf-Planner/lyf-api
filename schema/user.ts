import { ItemUserRelations } from './database/items_on_users';
import { NoteUserRelations } from './database/notes_on_users';
import { UserDbObject, UserExposedFields, UserPublicFields } from './database/user';
import { UserFriendshipRelations } from './database/user_friendships';
import { Item } from './items';
import { Note } from './notes';

export interface UserFriend extends UserPublicFields, UserFriendshipRelations {
  relations?: {
    users?: UserFriend[];
  }
}
export interface UserRelatedItem extends Item, ItemUserRelations {}
export interface UserRelatedNote extends Note, NoteUserRelations {}
export interface UserNotification extends Notification {}

export type UserRelatedEntity = UserFriend | UserRelatedItem | UserRelatedNote;

export interface UserRelations {
  users: UserFriend[];
  items: UserRelatedItem[];
  notes: UserRelatedNote[];
  notifications: UserNotification[];
}

export interface User extends UserDbObject {
  relations: Partial<UserRelations>;
}
export interface ExposedUser extends UserExposedFields {
  relations: Partial<UserRelations>;
}
export interface PublicUser extends UserPublicFields {
  relations?: Partial<UserRelations>;
}
