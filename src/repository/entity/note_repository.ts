import { NoteDbObject } from '../../types/schema/database/notes';
import { EntityRepository } from './_entity_repository';

const TABLE_NAME = 'notes';

export class NoteRepository extends EntityRepository<NoteDbObject> {
  constructor() {
    super(TABLE_NAME);
  }
}
