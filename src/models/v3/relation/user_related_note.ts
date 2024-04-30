import { NoteDbObject } from '../../../api/schema/database/notes';
import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../../api/schema/database/notes_on_users';
import { UserRelatedNote } from '../../../api/schema/user';
import { BaseRelation } from './base_relation';

export class UserNoteRelation extends BaseRelation<UserRelatedNote> {
  protected parse(combined_db_object: NoteDbObject & NoteUserRelationshipDbObject) {
    const { note_id_fk, user_id_fk, ...parsed } = combined_db_object;
    return parsed;
  }
}
