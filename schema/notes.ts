import { ItemDbObject } from './database/items';
import { NoteDbObject } from './database/notes';
import { NoteUserRelations } from './database/notes_on_users';
import { UserPublicFields } from './database/user';

export interface NoteRelatedUser extends UserPublicFields, NoteUserRelations {}

export type NoteRelatedEntity = ItemDbObject | NoteRelatedUser;

export interface NoteRelations {
  users: NoteRelatedUser[];
  items: ItemDbObject[];
}

export interface Note extends NoteDbObject {
  relations: Partial<NoteRelations>;
}
