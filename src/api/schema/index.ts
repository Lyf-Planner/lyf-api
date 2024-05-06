import { DbBaseObject } from './database';
import { Item, ItemRelatedEntity } from './items';
import { Note, NoteRelatedEntity } from './notes';
import { ExposedUser, PublicUser, User, UserRelatedEntity } from './user';

export type Relation = ItemRelatedEntity | NoteRelatedEntity | UserRelatedEntity;

export type Entity = DbBaseObject | Relation;

// The final outgoing types
export type EntityGraphRoot = DbBaseObject & {
  relations: Record<string, EntitySubgraph|EntitySubgraph[]>;
};

export type EntitySubgraph = Relation & {
  relations: Record<string, EntitySubgraph|EntitySubgraph[]>;
};

export type EntityGraph = EntityGraphRoot | EntitySubgraph;

// Explicitly listed node types
export type GraphExport = ExposedUser | User | PublicUser | Item | Note;
