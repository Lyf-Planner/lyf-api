import { NoteUserRelationship } from '../api/schema/notes_on_users';
import { UserID } from '../api/schema/user';
import { BaseModel } from './base_model';

export class NoteUserRelationshipModel extends BaseModel<NoteUserRelationship> {
  constructor(content: NoteUserRelationship, requestor: UserID) {
    super(content, requestor);
  }
}
