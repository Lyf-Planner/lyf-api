import { NoteDbObject } from '../api/schema/database/notes';
import { EntityRepository } from './entity_repository';

const TABLE_NAME = 'notes';

export class NoteRepository extends EntityRepository<NoteDbObject> {
  constructor() {
    super(TABLE_NAME);
  }
}
