import { ItemUserRepository } from '../repository/item_user_repository';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class ItemUserService extends BaseService {
  private logger = Logger.of(ItemUserService);
  private repository: ItemUserRepository;

  constructor(item_user_repository: ItemUserRepository) {
    super();
    this.repository = item_user_repository;
  }
}
