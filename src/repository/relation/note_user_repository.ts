import { ID } from '../../../schema/database/abstract';
import { NoteDbObject } from '../../../schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../../schema/database/notes_on_users';
import { UserDbObject } from '../../../schema/database/user';
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

  public async deleteAllNoteRelations(note_id: ID) {
    await this.db
    .deleteFrom(this.table_name)
    .where('note_id_fk', '=', note_id)
    .execute();
  }

  async findNoteRelatedUsers(
    note_id: string
  ): Promise<(UserDbObject & NoteUserRelationshipDbObject)[]> {
    return await this.db
    .selectFrom('users')
    .distinctOn('users.id')
    .innerJoin('notes_on_users', 'users.id', 'notes_on_users.user_id_fk')
    .where((eb) =>
        eb.or([
          eb('notes_on_users.note_id_fk', '=', note_id), 
          eb('notes_on_users.note_id_fk', 'in', (eb2) =>
            eb2
              .selectFrom('note_children')
              .select('parent_id')
              .where('child_id', '=', note_id)
          )
        ])
    )
    .selectAll('users')
    .selectAll('notes_on_users')
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

  async findRootNotes(
    user_id: string
  ): Promise<(NoteDbObject & NoteUserRelationshipDbObject)[]> {
    const result = await this.db
      .selectFrom('notes')
      // Join to get notes with direct permission.
      .innerJoin('notes_on_users', 'notes.id', 'notes_on_users.note_id_fk')
      // Left join to the note_children table to see if a note has any parents.
      .leftJoin('note_children', 'notes.id', 'note_children.child_id')
      // Left join to see if the user has permission for that parent.
      .leftJoin('notes_on_users as nou', (join) =>
        join
          .onRef('note_children.parent_id', '=', 'nou.note_id_fk')
          .on('nou.user_id_fk', '=', user_id)
      )
      // Filter to only include rows where the user has direct permission.
      .where('notes_on_users.user_id_fk', '=', user_id)
      // And where there is no parent with permission (the join is null).
      .where('nou.note_id_fk', 'is', null)
      // Select only the note columns.
      .selectAll('notes')
      .selectAll('notes_on_users')
      .execute();

    return result;
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
