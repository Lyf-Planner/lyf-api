import { NoteDbObject } from '../api/schema/database/notes';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'notes';

export class NoteRepository extends BaseRepository<NoteDbObject> {
  constructor() {
    super(TABLE_NAME);
  }
}
