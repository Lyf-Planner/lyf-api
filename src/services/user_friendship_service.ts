import { UserFriendshipRepository } from '../repository/user_friendship_repository';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class UserFriendshipService extends BaseService {
  private logger = Logger.of(UserFriendshipService);
  private repository: UserFriendshipRepository;

  constructor(note_user_repository: UserFriendshipRepository) {
    super();
    this.repository = note_user_repository;
  }
}
