import { Item, ItemRelations } from './items';
import { ItemNoteRelationship, ItemNoteRelationshipRelations } from './items_on_notes';
import { ItemUserRelationship, ItemUserRelationshipRelations } from './items_on_users';
import { Note, NoteRelations } from './notes';
import { NoteUserRelationship, NoteUserRelationshipRelations } from './notes_on_users';
import { User, UserRelations } from './user';
import { UserFriendship, UserFriendshipRelations } from './user_friendships';

export interface Models {
  items: Item;
  items_on_notes: ItemNoteRelationship;
  items_on_users: ItemUserRelationship;
  notes: Note;
  notes_on_users: NoteUserRelationship;
  users: User;
  user_friendships: UserFriendship;
}

export interface ModelRelations {
  items: ItemRelations;
  items_on_notes: ItemNoteRelationshipRelations;
  items_on_users: ItemUserRelationshipRelations;
  notes: NoteRelations;
  notes_on_users: NoteUserRelationshipRelations;
  users: UserRelations;
  user_friendships: UserFriendshipRelations;
}

export type Model = Models[keyof Models];
export type ModelRelation = ModelRelations[keyof ModelRelations];
