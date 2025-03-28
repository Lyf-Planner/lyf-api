import { sql } from 'kysely';

import { NoteChildDbObject, NoteChildPrimaryKey } from '../../../schema/database/note_children';
import { NoteDbObject } from '../../../schema/database/notes';
import { ID } from '../../../schema/mongo_schema/abstract';

import { RelationRepository } from './_relation_repository';

const TABLE_NAME = 'note_children';

export class NoteChildRepository extends RelationRepository<NoteChildDbObject> {
  protected readonly pk_a: keyof NoteChildPrimaryKey = 'child_id';
  protected readonly pk_b: keyof NoteChildPrimaryKey = 'parent_id';

  constructor() {
    super(TABLE_NAME);
  }

  // this is part two of moving a note,
  // we need to create a relation between the note and all it's descendents, with the parent and all it's ancestors
  async attachSubtree(note_id: ID, parent_id: ID) {
    await this.db
      // 1) ancestors_of_parent
      .with('ancestors_of_parent', (db) =>
        db
          .selectFrom('note_children')
          .select([
            'note_children.parent_id as note_id',
            'note_children.distance'
          ])
          .where('note_children.child_id', '=', parent_id)
          // include the parent_id itself for easier calculation later
          .unionAll(
            db
              .selectFrom('notes')
              .select((eb) => [
                eb.ref('notes.id').as('note_id'),
                eb.val(0).as('distance')
              ])
              .where('notes.id', '=', parent_id)
          )

      )

      // 2) subtree_of_note
      .with('subtree_of_note', (db) =>
        db
          .selectFrom('note_children')
          .select([
            'note_children.child_id as note_id',
            'note_children.distance'
          ])
          .where('note_children.parent_id', '=', note_id)
          // Optionally include noteId itself at distance=0 if not guaranteed:
          .unionAll(
            db
              .selectFrom('notes')
              .select((eb) => [
                eb.ref('notes.id').as('note_id'),
                eb.val(0).as('distance')
              ])
              .where('notes.id', '=', note_id)
          )
      )

      // 3) cross_product - get all ancestor / descendant combinations
      .with('cross_product', (db) =>
        db
          .selectFrom('ancestors_of_parent as anc')
          .innerJoin('subtree_of_note as sub', (join) =>
            // hack in an always true condition, so every row matches every row - giving us every combination
            join.on(sql`1 = 1`)
          )
          .select((eb) => ([
            eb.ref('anc.note_id').as('parent_id'),
            eb.ref('sub.note_id').as('child_id'),
            sql`anc.distance + 1 + sub.distance`.as('distance'),
            // cast to int in sql - this doesn't happen with distance because of the addition involved (i think)
            sql`0::int`.as('sorting_rank')
          ]))
      )

      // 4) Insert from cross_product into 'note_children'
      .insertInto('note_children')
      .columns(['parent_id', 'child_id', 'distance', 'sorting_rank'])
      .expression((db) =>
        db
          .selectFrom('cross_product')
          .selectAll()
      )
      // If (parent_id, child_id) is unique, skip duplicates rather than error
      .onConflict((oc) => oc.columns(['parent_id', 'child_id']).doNothing())
      .execute();
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
    note_id: ID
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
      // 1) subtree_of_note:
      //    In a closure table that stores *all* levels of ancestry/descendancy,
      //    rows with parent_id = noteId represent *every* descendant,
      //    plus we explicitly union the note itself from the 'notes' table.
      .with('subtree_of_note', (db) =>
        // Start with the note itself
        db
          .selectFrom('notes')
          .where('notes.id', '=', note_id)
          .select('notes.id as note_id')
          // Union all child rows from note_children
          .unionAll(
            db
              .selectFrom('note_children as nc')
              .select(['nc.child_id as note_id'])
              .where('nc.parent_id', '=', note_id)
          )
      )

      // 2) user_accessible_notes:
      //    All notes the user can access (directly or by being a child
      //    of a note they can access), EXCLUDING any note that's in subtree_of_note.
      .with('user_accessible_notes', (db) =>
        // Direct permission
        db
          .selectFrom('notes_on_users as nou')
          .select('nou.note_id_fk as note_id')
          .where('nou.user_id_fk', '=', user_id)
          .where('nou.note_id_fk', 'not in', (db) =>
            db.selectFrom('subtree_of_note').select('subtree_of_note.note_id')
          )
          // Union in the "child-of-accessible-parent" notes
          .unionAll(
            db
              .selectFrom('note_children as nc')
              .innerJoin('notes_on_users as nou', 'nc.parent_id', 'nou.note_id_fk')
              .select(['nc.child_id as note_id'])
              .where('nou.user_id_fk', '=', user_id)
              .where('nc.child_id', 'not in', (db) =>
                db.selectFrom('subtree_of_note').select('subtree_of_note.note_id')
              )
          )
      )

      // 3) Delete rows from the closure table
      //    child_id is in the subtree, parent_id is a user-accessible note (outside the subtree).
      .deleteFrom('note_children')
      .where(
        'child_id',
        'in',
        (db) => db.selectFrom('subtree_of_note').select('subtree_of_note.note_id')
      )
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
