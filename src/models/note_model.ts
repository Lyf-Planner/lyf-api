import { Note } from '../api/schema/notes';
import { UserID } from '../api/schema/user';
import { BaseModel } from './base_model';

export class NoteModel extends BaseModel<Note> {
  constructor(content: Note, requestor: UserID) {
    super(content, requestor);
  }
}
