import { ItemRepository } from '../repository/item_repository';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class ItemService extends BaseService {
  private logger = Logger.of(ItemService);
  private repository: ItemRepository;

  constructor(item_repository: ItemRepository) {
    super();
    this.repository = item_repository;
  }
}
