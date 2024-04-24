import { UserID } from '../api/schema/database/user';
import { Note } from '../api/schema/notes';
import { NoteModel } from '../models/note_model';
import { NoteRepository } from '../repository/note_repository';
import { Logger } from '../utils/logging';
import { ModelService } from './abstract/model_service';

export class NoteService extends ModelService<Note, NoteModel> {
  private logger = Logger.of(NoteService);
  protected repository: NoteRepository;
  protected modelFactory = (note: Note, requested_by: UserID) => new NoteModel(note, requested_by);

  constructor(note_repository: NoteRepository) {
    super();
    this.repository = note_repository;
  }
}
