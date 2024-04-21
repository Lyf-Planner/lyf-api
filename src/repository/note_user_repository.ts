import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { NoteUserPrimaryKey, NoteUserRelationshipDbObject } from '../api/schema/notes_on_users';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'notes_on_users';

export class NoteUserRepository extends BaseRepository<NoteUserRelationshipDbObject> {
  constructor(db: Kysely<Database>) {
    super(db, TABLE_NAME);
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

  async findByUserId(user_id: string): Promise<NoteUserRelationshipDbObject[]> {
    return this.db.selectFrom(TABLE_NAME).selectAll().where('user_id_fk', '=', user_id).execute();
  }

  async findByNoteId(note_id: string): Promise<NoteUserRelationshipDbObject[]> {
    return this.db.selectFrom(TABLE_NAME).selectAll().where('note_id_fk', '=', note_id).execute();
  }
}
