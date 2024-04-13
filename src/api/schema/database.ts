import { ItemDbObject } from './items';
import { ItemNoteRelationshipDbObject } from './items_on_notes';
import { ItemUserRelationshipDbObject } from './items_on_users';
import { NoteDbObject } from './notes';
import { NoteUserRelationshipDbObject } from './notes_on_users';
import { UserDbObject } from './user';
import { UserFriendshipDbObject } from './user_friendships';

export interface Database {
  users: UserDbObject;
  user_frienships: UserFriendshipDbObject;
  items: ItemDbObject;
  notes: NoteDbObject;
  items_on_notes: ItemNoteRelationshipDbObject;
  items_on_users: ItemUserRelationshipDbObject;
  notes_on_users: NoteUserRelationshipDbObject;
}
