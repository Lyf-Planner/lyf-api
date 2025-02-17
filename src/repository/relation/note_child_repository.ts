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
}
