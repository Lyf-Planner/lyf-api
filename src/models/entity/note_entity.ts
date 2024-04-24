import { NoteDbObject } from '../../api/schema/database/notes';
import { UserID } from '../../api/schema/database/user';
import { Note, NoteRelatedItem, NoteRelatedUser, NoteRelations } from '../../api/schema/notes';
import { Logger } from '../../utils/logging';
import { BaseEntity } from './base_entity';

export class NoteEntity extends BaseEntity<Note> {
  private logger = Logger.of(NoteEntity);

  constructor(entity: Note, requested_by: UserID) {
    super(entity, requested_by);
  }

  protected parse(dbObject: NoteDbObject) {
    const initialRelations: NoteRelations = {
      users: [] as NoteRelatedUser[],
      items: [] as NoteRelatedItem[]
    };

    return {
      ...dbObject,
      ...initialRelations
    };
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

  public includeRelations(relations: Partial<NoteRelations>) {
    this.update(relations);
  }

  public export() {
    return this.entity;
  }
}
