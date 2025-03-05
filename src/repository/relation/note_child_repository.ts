import { ID } from '../../../schema/mongo_schema/abstract';
import { RelationRepository } from './_relation_repository';
import { NoteChildDbObject, NoteChildPrimaryKey } from '../../../schema/database/note_children';
import { NoteDbObject } from '../../../schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../../schema/database/notes_on_users';

const TABLE_NAME = 'note_children';

export class NoteChildRepository extends RelationRepository<NoteChildDbObject> {
  protected readonly pk_a: keyof NoteChildPrimaryKey = 'child_id';
  protected readonly pk_b: keyof NoteChildPrimaryKey = 'parent_id';

  constructor() {
    super(TABLE_NAME);
  }

  // override the base creation method, to prevent re-inserting elements with the same keys.
  // this happens when we move a note, and create a relation with all of the parents' ancestors.
  async create(object: NoteChildDbObject) {
    const [created] = await this.db
      .insertInto(this.table_name)
      .values(object)
      .onConflict((oc) =>
        oc.columns(['parent_id', 'child_id']).doNothing()
      )
      .returningAll()
      .execute();

    return created as NoteChildDbObject;
  }

  async findFolderDescendants(parent_id: ID): Promise<(NoteDbObject & NoteChildDbObject)[]> {
    return await this.db
      .selectFrom(TABLE_NAME)
      .innerJoin('notes', 'notes.id', 'child_id')
      .selectAll()
      .where((eb) => eb('parent_id', '=', parent_id))
      .execute();
  }

  async findFolderChildren(parent_id: ID): Promise<(NoteDbObject & NoteChildDbObject)[]> {
    return await this.db
      .selectFrom(TABLE_NAME)
      .innerJoin('notes', 'notes.id', 'child_id')
      .selectAll()
      .where((eb) => eb('parent_id', '=', parent_id))
      .where((eb) => eb('distance', '=', 1))
      .execute();
  }

  async findAncestors(id: ID): Promise<NoteChildDbObject[]> {
    return await this.db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where((eb) => eb('child_id', '=', id))
      .execute();
  }

  async deleteAllParents(
    note_id: ID,
  ): Promise<void> {
    const result = await this.db
      .deleteFrom('note_children')
      .where('child_id', '=', note_id)
      .execute();
  }

  // when we move a note, we should only delete parent relations
  // for parent notes the user moving the note actually has access to.
  // this also includes deleting the relation between those parents and children of the note_id note
  async deleteParentsUserCanAccess(
    note_id: ID,
    user_id: ID
  ): Promise<void> {
    const result = await this.db
      // (1) CTE: user_accessible_notes
      .with('user_accessible_notes', (db) =>
        db
          // Get the note_ids of all notes I have a direct relationship with
          .selectFrom('notes_on_users as uon')
          .select('uon.note_id_fk as note_id')
          .where('uon.user_id_fk', '=', user_id)
          // Get the note_ids of all notes I have an inherited relationship with
          .unionAll(
            db
              .selectFrom('note_children as nc')
              .innerJoin('notes_on_users as uon', 'nc.parent_id', 'uon.note_id_fk')
              .select(['nc.child_id as note_id'])
              .where('uon.user_id_fk', '=', user_id)
          )
      )
      // (2) CTE: descendants_of_note
      .with('descendants_of_note', (db) =>
        db
          .selectFrom('note_children as nc')
          .select('nc.child_id')
          .where('nc.parent_id', '=', note_id)
      )
      // (3) Delete statement
      .deleteFrom('note_children')
      .where((eb) => eb.or([
        eb('child_id', '=', note_id),
        eb(
          'child_id',
          'in',
          (db) => db.selectFrom('descendants_of_note').select('descendants_of_note.child_id')
        )
      ]))
      .where(
        'parent_id',
        'in',
        (db) => db.selectFrom('user_accessible_notes').select('user_accessible_notes.note_id')
      )
      .execute();

    console.log('deleted relations:', result);
  }

  async deleteRelation(child_id: ID, parent_id: ID) {
    await this.db
      .deleteFrom(this.table_name)
      .where('child_id', '=', child_id)
      .where('parent_id', '=', parent_id)
      .execute();
  }
  
  async deleteAllRelations(note_id: ID) {
    await this.db
      .deleteFrom(this.table_name)
      .where((eb) =>
        eb.or([eb('child_id', '=', note_id), eb('parent_id', '=', note_id)])
      )
      .execute();
  }

  async updateRelation(
    child_id: ID,
    parent_id: ID,
    changes: Partial<NoteChildDbObject>
  ) {
    return await this.db
      .updateTable(TABLE_NAME)
      .where((eb) => eb.and([
        eb('child_id', '=', child_id),
        eb('parent_id', '=', parent_id)
      ]))
      .set(changes)
      .returningAll()
      .execute();
  }
}
