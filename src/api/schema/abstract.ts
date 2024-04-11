import { Generated } from 'kysely';

// IDs are numbers from postgres autoincrement (under the Kysely hood)
export type ID = number;

export interface Identifiable {
  id: Generated<ID>;
}

export interface Timestamps {
  created: Date;
  last_updated: Date;
}

export interface DbObject extends Identifiable, Timestamps {}
