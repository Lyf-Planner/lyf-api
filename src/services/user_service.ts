import { UserDbObject, UserID } from '../api/schema/database/user';
import { User } from '../api/schema/user';
import { UserModel } from '../models/user_model';
import { UserRepository } from '../repository/user_repository';
import { formatDateData } from '../utils/dates';
import { Logger } from '../utils/logging';
import { AuthService } from './auth_service';
import { ItemService } from './item_service';
import { ModelService } from './abstract/model_service';

export class UserService extends ModelService<User, UserModel> {
  protected repository: UserRepository;
  private logger = Logger.of(UserService);
  protected modelFactory = (user: User, requested_by: UserID) => new UserModel(user, requested_by);

  constructor() {
    super();
    this.repository = new UserRepository();
  }

  // Builder method
  public async retrieveForUser(user_id: UserID, requestor_id: UserID): Promise<UserModel> {
    const userData = await this.repository.findByUserId(user_id);
    if (!userData) {
      throw new Error(`User ${user_id} does not exist`);
    }

    const user = new UserModel(userData, requestor_id);

    return user;
  }

  async initialiseUser(user_id: UserID, password: string, tz: string): Promise<UserModel> {
    const creationDate = new Date();

    const userCreationData: UserDbObject = {
      created: creationDate,
      last_updated: creationDate,
      user_id,
      pass_hash: await new AuthService().hashPass(password),
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

    const user = await this.createNew(userCreationData, user_id);
    await new ItemService().createUserIntroItem(user_id, tz);

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
