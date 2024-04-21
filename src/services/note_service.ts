import { NoteRepository } from '../repository/note_repository';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class NoteService extends BaseService {
  private logger = Logger.of(NoteService);
  private repository: NoteRepository;

  constructor(note_repository: NoteRepository) {
    super();
    this.repository = note_repository;
  }
}
