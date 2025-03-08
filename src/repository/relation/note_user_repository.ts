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

  public async deleteAllDirectRelations(note_id: ID) {
    await this.db
    .deleteFrom(this.table_name)
    .where('note_id_fk', '=', note_id)
    .execute();
  }

  public async deleteAllDirectDescendantRelations(note_id: ID) {
    await this.db
    .with('subtree_of_note', (db) =>
      db
        .selectFrom('note_children')
        .select('note_children.child_id as note_id')
        .where('note_children.parent_id', '=', note_id)
    )
    .deleteFrom(this.table_name)
    .where(
      'note_id_fk',
      'in',
      (db) => db.selectFrom('subtree_of_note').select('subtree_of_note.note_id')
    )
    .execute();
  }

  async findDirectlyRelatedUsers(
    note_id: string
  ): Promise<(UserDbObject & NoteUserRelationshipDbObject)[]> {
    return await this.db
    .selectFrom('users')
    .innerJoin('notes_on_users', 'users.id', 'notes_on_users.user_id_fk')
    .where('note_id_fk', '=', note_id)
    .selectAll('users')
    .selectAll('notes_on_users')
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

  // root notes are notes where:
  // - the user has a relation with the note
  // - the user does not have a relation with any parents, if they exist
  async findRootNotes(
    user_id: string
  ): Promise<(NoteDbObject & NoteUserRelationshipDbObject)[]> {
    const result = await this.db
      .with('user_accessible_notes', (db) =>
        db
          // 1. Direct permission
          .selectFrom('notes_on_users as nou')
          .where('nou.user_id_fk', '=', user_id)
          .select('nou.note_id_fk as note_id')
          // 2. Inherited permission
          .unionAll(
            db
              .selectFrom('note_children as nc')
              .innerJoin('notes_on_users as nou', 'nc.parent_id', 'nou.note_id_fk')
              .where('nou.user_id_fk', '=', user_id)
              .select(['nc.child_id as note_id'])
          )
      )
      // Now select root notes:
      .selectFrom('notes as n')
      // restrict to user-accessible notes
      .innerJoin('user_accessible_notes as uan', 'n.id', 'uan.note_id')
      // also join the user-note relationship row for the same user
      .innerJoin('notes_on_users as nou', (join) =>
        join
          // Compare columns: nou.note_id_fk = n.id
          .onRef('nou.note_id_fk', '=', 'n.id')
      
          // Compare a column to a parameter: nou.user_id_fk = userId
          .on('nou.user_id_fk', '=', user_id)
      )
      // root = no accessible parent
      .where((eb) =>
        eb.not(
          eb.exists(
            (db) => db
              .selectFrom('note_children as nc')
              .innerJoin('user_accessible_notes as uan2', 'nc.parent_id', 'uan2.note_id')
              .select('nc.child_id')
              .whereRef('nc.child_id', '=', 'n.id')
          )
        )
      )
      // get all columns from notes and notes_on_users
      .selectAll('n')
      .selectAll('nou')
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
