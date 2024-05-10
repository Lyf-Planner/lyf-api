import { NoteDbObject } from '../../api/schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../api/schema/database/notes_on_users';
import { UserDbObject } from '../../api/schema/database/user';
import { RelationRepository } from './_relation_repository';

const TABLE_NAME = 'notes_on_users';

export class NoteUserRepository extends RelationRepository<NoteUserRelationshipDbObject> {
  protected readonly pk_a = 'note_id_fk';
  protected readonly pk_b = 'user_id_fk';

  constructor() {
    super(TABLE_NAME);
  }

  async findNoteRelatedUsers(
    note_id: string
  ): Promise<(UserDbObject & NoteUserRelationshipDbObject)[]> {
    return await this.db
      .selectFrom('users')
      .innerJoin('notes_on_users', 'users.id', 'notes_on_users.user_id_fk')
      .selectAll()
      .where('note_id_fk', '=', note_id)
      .execute();
  }

  async findUserRelatedNotes(
    user_id: string
  ): Promise<(NoteDbObject & NoteUserRelationshipDbObject)[]> {
    return await this.db
      .selectFrom('notes')
      .innerJoin('notes_on_users', 'notes.id', 'notes_on_users.note_id_fk')
      .selectAll()
      .where('user_id_fk', '=', user_id)
      .execute();
  }
}
