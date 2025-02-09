import { ID } from '../../../schema/database/abstract';
import { NoteChildDbObject } from '../../../schema/database/note_children';
import { NoteDbObject } from '../../../schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../../schema/database/notes_on_users';
import { EntityRepository } from './_entity_repository';

const TABLE_NAME = 'notes';

export class NoteRepository extends EntityRepository<NoteDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findAncestorPermissions(id: ID, user_id: ID): Promise<(NoteChildDbObject & NoteUserRelationshipDbObject)[]> {
    return await this.db
      .selectFrom('note_children')
      .where((eb) => eb('child_id', '=', id))
      .innerJoin('notes_on_users', 'note_id_fk', 'parent_id')
      .where('user_id_fk', '=', user_id)
      .selectAll()
      .execute();
  }

}
