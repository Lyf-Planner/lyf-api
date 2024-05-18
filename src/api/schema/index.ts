import { Item, ItemRelatedEntity } from './items';
import { Note, NoteRelatedEntity } from './notes';
import { ExposedUser, PublicUser, User, UserRelatedEntity } from './user';

export type Relation = ItemRelatedEntity | NoteRelatedEntity | UserRelatedEntity;
export type Entity = ExposedUser | User | PublicUser | Item | Note;

export type Export = Entity | Relation;
