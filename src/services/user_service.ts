import { UserDbObject, UserID } from '../api/schema/user';
import { UserModel } from '../models/user_model';
import postgresDb from '../repository/db/pg/postgres_db';
import { ItemRepository } from '../repository/item_repository';
import { UserRepository } from '../repository/user_repository';
import { formatDateData } from '../utils/dates';
import { Logger } from '../utils/logging';
import { AuthService } from './auth_service';
import { BaseService } from './base_service';
import { ItemService } from './item_service';

export class UserService extends BaseService {
  private logger = Logger.of(UserService);
  private repository: UserRepository;

  constructor(user_repository: UserRepository) {
    super();
    this.repository = user_repository;
  }

  // Builder method
  public async retrieveForUser(user_id: UserID, requestor_id: UserID): Promise<UserModel> {
    // Fetch user
    const userData = await this.repository.findByUserId(user_id);
    if (!userData) {
      throw new Error(`User ${user_id} does not exist`);
    }

    const user = new UserModel(userData, requestor_id);

    // Ensure not private
    const user_undiscoverable = !user.requestedBySelf() && user.isPrivate();
    if (user_undiscoverable) {
      this.logger.warn(`User ${user_id} was queried but hidden due to privacy`);
      throw new Error(`User ${user_id} does not exist`);
    }

    return user;
  }

  // Builder method
  async createNew(user_id: UserID, password: string, tz: string): Promise<UserModel> {
    const repository = new ItemRepository(postgresDb);
    const creationDate = new Date();

    const userCreationData: UserDbObject = {
      created: creationDate,
      last_updated: creationDate,
      user_id,
      pass_hash: await AuthService.hashPass(password),
      private: false,
      tz: tz,
      expo_tokens: [],
      first_day: formatDateData(creationDate),
      display_name: undefined,
      pfp_url: undefined,
      daily_notifications: false,
      daily_notification_time: '08:00',
      persistent_daily_notification: false,
      event_notifications_enabled: true,
      event_notification_minutes_before: 5
    };

    const newUserData = await this.repository.create(userCreationData);
    const user = new UserModel(newUserData, user_id);

    await new ItemService(repository).createUserIntroItem(user_id, tz);

    return user;
  }

  async retrieveManyUsers(user_ids: UserID[], requestor: UserID) {
    const rawUsers = await this.repository.findManyByUserId(user_ids);
    const exportedUsers = rawUsers
      .filter((x) => !x.private)
      .map((x) => new UserModel(x, requestor).export());

    return exportedUsers;
  }
}
