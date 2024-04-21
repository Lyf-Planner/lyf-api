import { ItemNoteRepository } from '../repository/item_note_repository';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class ItemNoteService extends BaseService {
  private logger = Logger.of(ItemNoteService);
  private repository: ItemNoteRepository;

  constructor(item_note_repository: ItemNoteRepository) {
    super();
    this.repository = item_note_repository;
  }
}
