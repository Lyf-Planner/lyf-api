import { ID } from '../../api/schema/database/abstract';
import { UserDbObject } from '../../api/schema/database/user';
import { ExposedUser, PublicUser, User } from '../../api/schema/user';
import { UserEntity } from '../../models/v3/entity/user_entity';
import { UserRepository } from '../../repository/entity/user_repository';
import { formatDateData } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { EntityService } from './_entity_service';
import { AuthService } from '../auth_service';
import { ItemService } from './item_service';
import notificationService from '../notifications/timetable_notifications';

type UserCreationResult = {
  user: ExposedUser,
  token: string
}

export class UserService extends EntityService<UserDbObject> {
  protected logger = Logger.of(UserService);

  constructor() {
    super();
  }

  // --- USERS --- //

  async processCreation(user_id: ID, password: string, tz: string): Promise<UserCreationResult> {
    const creationDate = new Date();

    const userCreationData: UserDbObject = {
      created: creationDate,
      last_updated: creationDate,
      id: user_id,
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

    const user = new UserEntity(userCreationData.id);
    await user.create(userCreationData);

    await new ItemService().createUserIntroItem(user, tz);

    await user.fetchRelations();
    await user.load();

    return await this.returnWithToken(user, password);
  }

  async processUpdate(id: ID, changes: Partial<User>, from: ID) {
    if (id !== from) {
      throw new LyfError(`User ${from} cannot update another user ${id}`, 403);
    }

    const user = new UserEntity(id);
    await user.load();
    await user.update(changes);

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(user, changes);
    this.checkTimezoneChange(user, changes);

    this.logger.debug(`User ${id} safely updated their own data`);

    await user.save();
    return user;
  }

  public async retrieveForUser(user_id: ID, requestor_id: ID, include?: string): Promise<UserEntity> {
    const user = new UserEntity(user_id);
    await user.fetchRelations(include);
    await user.load();
    
    return user;
  }

  async retrieveManyUsers(user_ids: ID[], requestor: ID) {
    const repo = new UserRepository();
    const rawUsers = await repo.findManyByUserId(user_ids);
    const exportedUsers = rawUsers
      .filter((x) => !x.private)
      .map((x) => {
        const user = new UserEntity(x.id, x);
        return user.export(requestor)
      });

    return exportedUsers;
  }

  // --- FRIENDS --- //

  async createFriendship(id: ID, changes: Partial<User>, from: ID) {
    if (id !== from) {
      throw new LyfError(`User ${from} cannot update another user ${id}`, 403);
    }

    const user = new UserEntity(id);
    await user.load();
    await user.update(changes);

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(user, changes);
    this.checkTimezoneChange(user, changes);

    this.logger.debug(`User ${id} safely updated their own data`);

    await user.save();
    return user;
  }

  async processFriendshipUpdate(id: ID, changes: Partial<User>, from: ID) {
    if (id !== from) {
      throw new LyfError(`User ${from} cannot update another user ${id}`, 403);
    }

    const user = new UserEntity(id);
    await user.load();
    await user.update(changes);

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(user, changes);
    this.checkTimezoneChange(user, changes);

    this.logger.debug(`User ${id} safely updated their own data`);

    await user.save();
    return user;
  }

  // --- ITEMS --- //

  // --- NOTES --- //

  // --- HELPERS --- //

  async returnWithToken(user: UserEntity, password: string) {
    const token = await AuthService.authenticate(user, password) as string;
    const exported = await user.export(user.id()) as ExposedUser;

    return {
      token,
      user: exported
    }
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
