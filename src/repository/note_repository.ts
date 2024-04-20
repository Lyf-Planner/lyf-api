import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { NoteDbObject } from '../api/schema/notes';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'notes';

export class NoteRepository extends BaseRepository<NoteDbObject> {
  constructor(db: Kysely<Database>) {
    super(db, TABLE_NAME);
  }
}
