import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { ItemNoteRelationshipDbObject } from '../api/schema/items_on_notes';
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

  async findItemsByNoteId(note_id: string): Promise<ItemNoteRelationshipDbObject[]> {
    return await this.db
      .selectFrom('items')
      .innerJoin('items_on_notes', 'items.id', 'items_on_notes.item_id_fk')
      .selectAll()
      .where('note_id_fk', '=', note_id)
      .execute();
  }

  async findNotesByItemId(item_id: string): Promise<ItemNoteRelationshipDbObject[]> {
    return await this.db
      .selectFrom('notes')
      .innerJoin('items_on_notes', 'notes.id', 'items_on_notes.note_id_fk')
      .selectAll()
      .where('item_id_fk', '=', item_id)
      .execute();
  }
}
