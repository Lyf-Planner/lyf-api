import { ItemDbObject } from './database/items';
import { ItemNoteRelations } from './database/items_on_notes';
import { NoteDbObject } from './database/notes';
import { NoteUserRelations } from './database/notes_on_users';
import { UserPublicFields } from './database/user';

export interface NoteRelatedItem extends ItemDbObject, ItemNoteRelations {}
export interface NoteRelatedUser extends UserPublicFields, NoteUserRelations {}

export type NoteRelatedEntity = NoteRelatedItem | NoteRelatedUser;

export interface NoteRelations {
  users: NoteRelatedUser[];
  items: NoteRelatedItem[];
}

export interface Note extends NoteDbObject {
  relations: Partial<NoteRelations>;
}
