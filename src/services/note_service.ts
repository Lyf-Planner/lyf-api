import { UserID } from '../api/schema/database/user';
import { Note } from '../api/schema/notes';
import { NoteEntity } from '../models/entity/note_entity';
import { NoteRepository } from '../repository/note_repository';
import { Logger } from '../utils/logging';
import { EntityService } from './abstract/entity_service';

export class NoteService extends EntityService<Note, NoteEntity> {
  private logger = Logger.of(NoteService);
  protected repository: NoteRepository;
  protected modelFactory = (note: Note, requested_by: UserID) => new NoteEntity(note, requested_by);

  constructor(note_repository: NoteRepository) {
    super();
    this.repository = note_repository;
  }

  public safeUpdate(id: string, changes: Partial<Note>): void {}
}
