import { UserID } from '../api/schema/database/user';
import { Note } from '../api/schema/notes';
import { Logger } from '../utils/logging';
import { BaseModel } from './base_model';

export class NoteModel extends BaseModel<Note> {
  private logger = Logger.of(NoteModel);

  constructor(entity: Note, requested_by: UserID) {
    super(entity, requested_by);
  }

  public validate() {
    if (this.entity.users) {
      const user_ids = this.entity.users.map((x) => x.user_id);

      if (!user_ids.includes(this.requestedBy)) {
        this.logger.error(
          `User ${this.requestedBy} lost access to note ${this.entity.id} during process`
        );
        throw new Error(`User ${this.requestedBy} no longer has access to note ${this.entity.id}`);
      }
    }
  }

  public export() {
    return this.entity;
  }
}
