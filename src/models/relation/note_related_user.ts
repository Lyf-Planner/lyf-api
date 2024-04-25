import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../api/schema/database/notes_on_users';
import { UserDbObject } from '../../api/schema/database/user';
import { NoteRelatedUser } from '../../api/schema/notes';
import { BaseRelation } from './base_relation';

export class NoteUserRelation extends BaseRelation<NoteRelatedUser> {
  protected parse(combined_db_object: UserDbObject & NoteUserRelationshipDbObject) {
    const { note_id_fk, user_id_fk, ...parsed } = combined_db_object;
    return parsed;
  }
}
