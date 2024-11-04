import { ID } from '../../../schema/database/abstract';
import { UserDbObject } from '../../../schema/database/user';
import { ExposedUser, PublicUser, User } from '../../../schema/user';
import { UserEntity } from '../../models/entity/user_entity';
import { UserRepository } from '../../repository/entity/user_repository';
import { formatDateData } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { AuthService } from '../auth_service';
import reminderService from '../../modules/notification_scheduling/reminder_service';
import { EntityService } from './_entity_service';
import { ItemService } from './item_service';

export class UserService extends EntityService<UserDbObject> {
  protected logger = Logger.of(UserService);

  // --- USERS --- //

  async getEntity(user_id: string, include?: string) {
    const user = new UserEntity(user_id);
    await user.fetchRelations(include);
    await user.load();

    return user;
  }

  async processCreation(user_id: ID, pass_hash: string, tz: string): Promise<ExposedUser> {
    const creationDate = new Date();

    const userCreationData: UserDbObject = {
      created: creationDate,
      last_updated: creationDate,
      id: user_id,
      pass_hash,
      private: false,
      tz: tz,
      expo_tokens: [],
      first_day: formatDateData(creationDate),
      display_name: undefined,
      pfp_url: undefined,
      daily_notification_time: '08:30',
      persistent_daily_notification: false,
      event_notification_mins: 5,
      weather_data: true,
      auto_day_finishing: true,
    };

    const user = new UserEntity(userCreationData.id);
    await user.create(userCreationData, UserEntity.filter);

    await new ItemService().createUserIntroItems(user, tz);

    await user.fetchRelations("items");
    await user.load();

    return await user.export() as ExposedUser;
  }

  async processDeletion(user_id: string, password: string, from_id: string) {
    if (from_id !== user_id) {
      const message = `User ${from_id} tried to delete ${user_id}`;
      this.logger.error(message);

      throw new LyfError(message, 403);
    }

    const user = new UserEntity(user_id);
    await user.load()
    await user.fetchRelations();

    const authenticated = !!await AuthService.authenticateWithUser(user, password);
    if (authenticated) {
      await user.delete();
    } else {
      throw new LyfError(`User ${user_id} entered incorrect password when trying to delete self`, 401);
    }
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
    return user.export(from);
  }

  public async retrieveForUser(user_id: ID, requestor_id: ID, include?: string): Promise<ExposedUser | PublicUser> {    
    const user = await this.getEntity(user_id, include || '');

    return await user.export(requestor_id);
  }

  async retrieveManyUsers(user_ids: ID[], requestor: ID) {
    // TODO: Should change this to a static method on the UserEntity - as to not directly access repo
    const repo = new UserRepository();
    const rawUsers = await repo.findManyByUserId(user_ids);
    const exportedUsers = rawUsers
      .filter((x) => !x.private)
      .map((x) => {
        const user = new UserEntity(x.id, x);
        return user.export(requestor);
      });

    return exportedUsers;
  }

  // --- HELPERS --- //

  private checkDailyNotifications(user: UserEntity, changes: Partial<User>) {
    const notificationsTimeChange = changes.daily_notification_time;

    if (notificationsTimeChange === null) {
      reminderService.removeDailyNotifications(user);
    }

    if (notificationsTimeChange) {
      reminderService.updateDailyNotifications(user, notificationsTimeChange);
    }
  }

  private checkTimezoneChange(user: UserEntity, changes: Partial<User>) {
    if (changes.tz) {
      reminderService.handleUserTzChange(user, changes.tz);
    }
  }
}
