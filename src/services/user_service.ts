import { UserDbObject, UserID } from '../api/schema/database/user';
import { User } from '../api/schema/user';
import { UserEntity } from '../models/v3/entity/user_entity';
import { UserRepository } from '../repository/user_repository';
import { formatDateData } from '../utils/dates';
import { Logger } from '../utils/logging';
import { AuthService } from './auth_service';
import { ItemService } from './item_service';
import { EntityService } from './abstract/entity_service';
import notificationService, { NotificationService } from './notifications/notification_service';

export class UserService extends EntityService<UserDbObject, UserEntity> {
  private logger = Logger.of(UserService);

  protected repository: UserRepository;
  protected modelFactory = (user: UserDbObject, requested_by: UserID) =>
    new UserEntity(user, requested_by);

  constructor() {
    super();
    this.repository = new UserRepository();
  }

  // Builder method
  public async retrieveForUser(user_id: UserID, requestor_id: UserID): Promise<UserEntity> {
    const userData = await this.repository.findByUserId(user_id);
    if (!userData) {
      throw new Error(`User ${user_id} does not exist`);
    }

    const user = this.modelFactory(userData, requestor_id);

    return user;
  }

  async initialiseUser(user_id: UserID, password: string, tz: string): Promise<UserEntity> {
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
    const item = await new ItemService().createUserIntroItem(user, tz);

    user.includeRelations({ items: [item.get()] });

    return user;
  }

  async retrieveManyUsers(user_ids: UserID[], requestor: UserID) {
    const rawUsers = await this.repository.findManyByUserId(user_ids);
    const exportedUsers = rawUsers
      .filter((x) => !x.private)
      .map((x) => this.modelFactory(x, requestor).export());

    return exportedUsers;
  }

  async safeUpdate(id: UserID, changes: Partial<User>) {
    const existingDbObject = await this.repository.findByUserId(id);
    if (!existingDbObject) {
      throw new Error(`Tried to update non-existing user`);
    }

    const existingUser = this.modelFactory(existingDbObject, id);

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(existingUser, changes);
    this.checkTimezoneChange(existingUser, changes);

    this.logger.debug(`User ${id} safely updated their own data`);

    await this.commit(existingUser, changes);
  }

  private checkDailyNotifications(user: UserEntity, changes: Partial<User>) {
    const notificationsEnabledChange = changes.daily_notifications;
    const notificationsTimeChange = changes.daily_notification_time;

    if (notificationsEnabledChange && notificationsTimeChange) {
      notificationService.setDailyNotifications(user, notificationsTimeChange);
    } else if (notificationsTimeChange) {
      notificationService.updateDailyNotifications(user, notificationsTimeChange);
    } else if (notificationsEnabledChange === false) {
      notificationService.removeDailyNotifications(user);
    }
  }

  private checkTimezoneChange(user: UserEntity, changes: Partial<User>) {
    if (changes.tz) {
      notificationService.handleUserTzChange(user, changes.tz);
    }
  }
}
