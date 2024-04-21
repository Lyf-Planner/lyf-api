import { NoteUserRepository } from '../repository/note_user_repository';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class NoteUserService extends BaseService {
  private logger = Logger.of(NoteUserService);
  private repository: NoteUserRepository;

  constructor(note_user_repository: NoteUserRepository) {
    super();
    this.repository = note_user_repository;
  }
}
