import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../api/schema/database/notes_on_users';
import { UserDbObject } from '../../api/schema/database/user';
import { NoteRelatedUser } from '../../api/schema/notes';
import { BaseRelation } from './base_relation';

export class NoteUserRelation extends BaseRelation<NoteRelatedUser> {
  protected parseBase(base_db_object: UserDbObject) {
    return base_db_object;
  }

  protected parseRelation(relation_db_object: NoteUserRelationshipDbObject): NoteUserRelations {
    const { note_id_fk, user_id_fk, ...relations } = relation_db_object;
    return relations;
  }

  protected parse(
    base_db_object: UserDbObject,
    relation_db_object: NoteUserRelationshipDbObject
  ): NoteRelatedUser {
    return {
      ...this.parseBase(base_db_object),
      ...this.parseRelation(relation_db_object)
    };
  }
}
