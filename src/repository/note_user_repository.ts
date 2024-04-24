import { ItemNoteRelationshipDbObject } from '../api/schema/database/items_on_notes';
import { NoteDbObject } from '../api/schema/database/notes';
import {
  NoteUserPrimaryKey,
  NoteUserRelationshipDbObject
} from '../api/schema/database/notes_on_users';
import { UserDbObject } from '../api/schema/database/user';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'notes_on_users';

export class NoteUserRepository extends BaseRepository<NoteUserRelationshipDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByCompositeId({
    note_id_fk,
    user_id_fk
  }: NoteUserPrimaryKey): Promise<NoteUserRelationshipDbObject | undefined> {
    return this.db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where('note_id_fk', '=', note_id_fk)
      .where('user_id_fk', '=', user_id_fk)
      .executeTakeFirst();
  }

  async findNoteRelatedUsers(
    note_id: string
  ): Promise<(UserDbObject & NoteUserRelationshipDbObject)[]> {
    return await this.db
      .selectFrom('users')
      .innerJoin('notes_on_users', 'users.user_id', 'notes_on_users.user_id_fk')
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
