
import { ID } from '#/database/abstract';
import { NoteChildDbObject } from '#/database/note_children';
import { NoteDbObject } from '#/database/notes';
import { NoteUserRelationshipDbObject } from '#/database/notes_on_users';
import { EntityRepository } from '@/repository/entity/_entity_repository';

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
