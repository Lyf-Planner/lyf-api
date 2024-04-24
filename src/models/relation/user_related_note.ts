import { NoteDbObject } from '../../api/schema/database/notes';
import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../api/schema/database/notes_on_users';
import { UserRelatedNote } from '../../api/schema/user';
import { BaseRelation } from './base_relation';

export class UserNoteRelation extends BaseRelation<UserRelatedNote> {
  protected parseBase(base_db_object: NoteDbObject): NoteDbObject {
    return base_db_object;
  }

  protected parseRelation(relation_db_object: NoteUserRelationshipDbObject): NoteUserRelations {
    const { note_id_fk, user_id_fk, ...relations } = relation_db_object;
    return relations;
  }

  protected parse(
    base_db_object: NoteDbObject,
    relation_db_object: NoteUserRelationshipDbObject
  ): UserRelatedNote {
    return {
      ...this.parseBase(base_db_object),
      ...this.parseRelation(relation_db_object)
    };
  }
}
