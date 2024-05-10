import { DbEntityObject } from './database';
import { Item, ItemRelatedEntity } from './items';
import { Note, NoteRelatedEntity } from './notes';
import { ExposedUser, PublicUser, User, UserRelatedEntity } from './user';

export type Relation = ItemRelatedEntity | NoteRelatedEntity | UserRelatedEntity;

export type Entity = DbEntityObject | Relation;

// The final outgoing types
export type EntityGraphRoot<T extends DbEntityObject> = T & {
  relations: Record<string, EntitySubgraph|EntitySubgraph[]>;
};

export type EntitySubgraph = Relation & {
  relations: Record<string, EntitySubgraph|EntitySubgraph[]>;
};

export type EntityGraph = EntityGraphRoot<DbEntityObject> | EntitySubgraph;

// Explicitly listed node types
export type GraphExport = ExposedUser | User | PublicUser | Item | Note;