import { ID } from '../../api/schema/database/abstract';
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

  public async deleteRelation(note_id: ID, user_id: ID) {
    await this.db
      .deleteFrom(this.table_name)
      .where(this.pk_a, '=', note_id)
      .where(this.pk_b, '=', user_id)
      .execute();
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

  async updateRelation(
    note_id_fk: ID,
    user_id_fk: ID,
    changes: Partial<NoteUserRelationshipDbObject>
  ) {
    return await this.db
      .updateTable(TABLE_NAME)
      .set(changes)
      .where('note_id_fk', '=', note_id_fk)
      .where('user_id_fk', '=', user_id_fk)
      .returningAll()
      .execute();
  }
}
