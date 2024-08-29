import { ExpoPushMessage } from 'expo-server-sdk';
import moment from 'moment-timezone';

import { ItemStatus } from '../../types/mongo_schema/list';
import { DaysOfWeek } from '../../types/mongo_schema/timetable';
import { ItemType } from '../../types/schema/database/items';
import mongoDb from '../../db/mongo/mongo_db';
import { ItemEntity } from '../../models/entity/item_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { ItemUserRelation } from '../../models/relation/item_related_user';
import { UserItemRelation } from '../../models/relation/user_related_item';
import { formatDateData, isFutureDate, TwentyFourHourToAMPM } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { pluralisedQuantity } from '../../utils/text';
import { ItemService } from '../../services/entity/item_service';
import { UserService } from '../../services/entity/user_service';
import { ExpoPushService } from './expo_push_service';
import { NotificationRelatedData, NotificationType } from '../../types/schema/database/notifications';

const agenda = require('agenda');

export class ReminderService {
  private logger = Logger.of(ReminderService);
  private agendaInstance = new agenda({
    mongo: mongoDb.getDb(),
    db: { collection: 'cron-jobs' },
    processEvery: '1 minute',
    options: {
      useUnifiedTopology: true
    }
  });

  public init = async () => {
    this.defineEventNotification();
    this.defineRoutineNotification();
    this.defineDailyNotification();

    this.logger.info('Starting Agenda...');
    await this.agendaInstance.start();
    this.logger.info('Agenda started.');
  }

  public cleanup = async () => {
    this.logger.info('Cleaning up ReminderService');
    await this.agendaInstance.stop();
  }

  // --- EVENTS --- //

  public setEventNotification = async (item: ItemEntity, user: UserEntity, mins_before: number) => {
    if (item.isRoutine()) {
      // Defer to other handler for routine items
      this.setRoutineNotification(item, user);
      return;
    }

    if (!item.isFullyScheduled()) {
      // Can't schedule a notification without a date and time
      throw new LyfError('Cannot create a notification on an event without date and time', 400);
    }

    // Extract the scheduled time
    const id = this.getUniqueJobId(item.id(), user.id());
    const timezone = item.timezone();
    const setTime = this.getScheduledTime(item, mins_before, timezone);

    // Ensure notification is ahead of local time!
    this.logger.debug(`Notification ${id} set for ${setTime}`);
    if (!isFutureDate(setTime, timezone)) {
      this.logger.warn('Reminder is scheduled for a time that has already passed! Returning early');
      return;
    }

    this.logger.info(`Creating event notification ${id} at ${setTime.toUTCString()}`);
    await this.agendaInstance.schedule(setTime, 'Event Notification', {
      id,
      user_id: user.id(),
      item_id: item.id()
    });
  }

  public updateEventNotification = async (item: ItemEntity, user: UserEntity, mins_before: number) => {
    // The package does not offer a direct update method, so just recreate
    await this.removeEventNotification(item, user);
    await this.setEventNotification(item, user, mins_before);
    return;
  }

  public removeEventNotification = async (item: ItemEntity, user: UserEntity) => {
    this.logger.info(`Removing event notification ${item.id()}:${user.id()}`);
    const id = this.getUniqueJobId(item.id(), user.id());
    await this.agendaInstance.cancel({ 'data.id': id });
  }

  // --- DAILY --- //

  public setDailyNotifications = async (user: UserEntity, daily_time: string) => {
    this.logger.info(`Setting up daily notification for ${user.id()}`);

    const timeArray = daily_time.split(':');
    const job = this.agendaInstance.create('Daily Notification', {
      user_id: user.id()
    });

    const timezone = user.timezone();
    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * *`, { timezone });

    await job.save();
  }

  public updateDailyNotifications = async (user: UserEntity, new_daily_time: string) => {
    await this.removeDailyNotifications(user);
    await this.setDailyNotifications(user, new_daily_time);
  }

  public removeDailyNotifications = async (user: UserEntity) => {
    this.logger.info(`Removing daily notifications for user ${user.id()}`);
    await this.agendaInstance.cancel({ 'data.user_id': user.id() });
  }

  // --- ROUTINES --- //

  public setRoutineNotification = async (item: ItemEntity, user: UserEntity) => {
    this.logger.info(`Setting up routine notification for ${user.id()}`);

    const id = this.getUniqueJobId(item.id(), user.id());
    const job = this.agendaInstance.create('Routine Notification', {
      id,
      user_id: user.id(),
      item_id: item.id()
    });

    const itemTime = item.time();
    if (!itemTime) {
      throw new LyfError(`Cannot set routine notification on item ${item.id()}, it has no set time.`, 422);
    }

    const timeArray = itemTime.split(':');
    const timezone = item.timezone();

    // We do this +1 because Sunday is treated as the zeroth day otherwise
    const day = (Object.values(DaysOfWeek).findIndex((x) => x === item.day()) + 1) % 7;

    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * ${day}`, { timezone });
    await job.save();
  }

  public updateRoutineNotification = async (item: ItemEntity, user: UserEntity) => {
    await this.removeRoutineNotification(item, user);
    await this.setRoutineNotification(item, user);
  }

  public removeRoutineNotification = async (item: ItemEntity, user: UserEntity) => {
    this.logger.info(`Removing routine ${item.id()}:${user.id()}`);
    const id = this.getUniqueJobId(item.id(), user.id());
    await this.agendaInstance.cancel({ 'data.id': id });
  }

  // TIMEZONE CHANGE HANDLER

  public handleUserTzChange = async (user: UserEntity, new_tz: string) => {
    const dailyNotificationTime = user.dailyNotificationTime();

    if (!dailyNotificationTime) {
      return;
    }

    const newOffset = moment().tz(new_tz).utcOffset();
    const oldOffset = moment().tz(user.timezone()).utcOffset();

    if (oldOffset === newOffset) {
      this.logger.info(
        `User ${user.id()} changed timezone but offset is equivalent - won't update notifications`
      );
      return;
    }

    this.logger.info(`Adjusting notification timezones for user ${user.id()} to ${new_tz}`);

    const jobs = await mongoDb
      .getDb()
      .collection('cron-jobs')
      .find({ 'data.user_id': user.id() })
      .toArray();

    for (const job of jobs) {
      if (job.name === 'Daily Notification') {
        await this.updateDailyNotifications(user, dailyNotificationTime);
      }
    }
  }

  // EVENT NOTIFICATIONS

  private defineEventNotification() {
    this.logger.info('Defining Event Notifications');
    this.agendaInstance.define('Event Notification', async (job: any, done: () => void) => {
      const { id } = job.attrs.data;
      await this.sendItemNotification(id, true);
      done();
    });
  }

  // DAILY NOTIFICATIONS

  private defineDailyNotification() {
    this.logger.info('Defining Daily Notifications');
    this.agendaInstance.define('Daily Notification', async (job: any, done: () => void) => {
      const { userId } = job.attrs.data;

      const user = await new UserService().getEntity(userId);

      this.logger.info(`Sending daily notification to ${userId}`);
      const subtext = await this.getUserDaily(user);
      if (!subtext) {
        done();
        return;
      }

      const expoTokens = user.getSensitive(userId).expo_tokens || [];
      const message = this.formatExpoPushMessage(
        expoTokens,
        'Check Your Schedule!',
        '(Daily Reminder) ' + subtext
      );
      await new ExpoPushService().pushNotificationToExpo({
        messages: [message],
        type: NotificationType.ItemReminder, 
        to_id: userId,
        save: false // these have no real data, saving these would just be noise
      });
      done();
    });
  }

  // ROUTINE NOTIFICATIONS

  private defineRoutineNotification() {
    this.logger.info('Defining Routine Notifications');
    this.agendaInstance.define('Routine Notification', async (job: any, done: () => void) => {
      const { id } = job.attrs.data;
      await this.sendItemNotification(id);
      done();
    });
  }

  // HELPERS

  private sendItemNotification = async (id: string, clearFromRelation = true) => {
    try {
      const ids = id.split(':'); // IDs are stored like `${item_id}:${user_id}`
      const item_id = ids[0];
      const user_id = ids[1];

      const item = await new ItemService().getEntity(item_id, 'users');
      const itemUsers = item.getRelations().users as ItemUserRelation[];

      const itemUserRelation = itemUsers.find((x) => x.entityId() === user_id);

      if (!item || !itemUserRelation) {
        throw new LyfError(
          `Cannot send item ${item_id} notification to ${user_id} - one of item, user or relation was deleted`,
          400
        );
      }

      const itemUser = itemUserRelation.getRelatedEntity();

      const to = itemUser.getSensitive(user_id).expo_tokens;
      const title = item.title();
      const mins_before = itemUserRelation.notificationMinsBefore();
      const status = item.status();

      if (status === ItemStatus.Cancelled) {
        this.logger.warn(`Cancelling notification for ${id} as event was cancelled`);
        await this.agendaInstance.cancel({ 'data.id': id });
        return;
      }

      const time = item.time();

      if (!time) {
        this.logger.warn(`Cancelling notification for ${id} as item no longer has time`);
        await this.agendaInstance.cancel({ 'data.id': id });
        return;
      }

      const isEvent = item.type() === ItemType.Event;

      const subtext = mins_before
        ? `${isEvent ? 'Starting in' : 'In'} ${pluralisedQuantity(
            mins_before,
            'minute'
          )} (at ${TwentyFourHourToAMPM(time)})`
        : `${isEvent ? 'Starting now' : 'Now'} (${TwentyFourHourToAMPM(time)})`;

      this.logger.info(`Sending scheduled notification ${id} to ${user_id}`);

      const message = this.formatExpoPushMessage(to, title, subtext);
      await new ExpoPushService().pushNotificationToExpo({
        messages: [message], 
        type: NotificationType.ItemReminder, 
        to_id: user_id,
        related_data: NotificationRelatedData.Item,
        related_id: item_id
      });
      await this.agendaInstance.cancel({ 'data.id': id });

      if (clearFromRelation) {
        await itemUserRelation.update({ notification_mins: undefined });
        await itemUserRelation.save();
      }
    } catch (error) {
      const lyfError = error as LyfError;
      this.logger.warn(`Notification ${id} failed to send: ${lyfError.message}`);
    }
  }

  private getUniqueJobId = (prefix: string, suffix: string) => {
    return prefix + ':' + suffix;
  }

  private formatExpoPushMessage(to: string[], title: string, body: string) {
    return {
      to,
      title,
      body,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;
  }

  private async getUserDaily(user: UserEntity) {
    const userDate = moment().tz(user.timezone()).toDate();
    const userDateString = formatDateData(userDate);

    await user.fetchItemsInRange(userDateString, userDateString);
    await user.load();

    const userItemRelations = user.getRelations().items as UserItemRelation[];
    const userItems = userItemRelations.map((x) => x.getRelatedEntity());

    // Filter out template instantiations - will give rise to duplicates
    const parsedItems = userItems.filter((x) => !x.templateId());

    const eventCount = parsedItems.filter((x) => x.type() === ItemType.Event).length;
    const taskCount = parsedItems.filter((x) => x.type() === ItemType.Task).length;

    if (taskCount + eventCount === 0) {
      return user.persistentNotifications() ? 'Nothing planned for today?' : '';
    } else if (eventCount === 0) {
      return `You have ${pluralisedQuantity(taskCount, 'task')} today`;
    } else if (taskCount === 0) {
      return `You have ${pluralisedQuantity(eventCount, 'event')} today`;
    } else {
      return `You have ${pluralisedQuantity(eventCount, 'event')} and ${pluralisedQuantity(
        taskCount,
        'task'
      )} today`;
    }
  }

  private getScheduledTime = (item: ItemEntity, mins_before: number, timezone: string) => {
    const itemDate = item.date();
    const itemTime = item.time();

    if (!itemDate || !itemTime) {
      throw new LyfError(
        `Cannot set an event notification without a time and date on item ${item.title()}`, 422
      );
    }

    const dateArray = itemDate.split('-').map((x) => parseInt(x));
    const timeArray = itemTime.split(':').map((x) => parseInt(x));
    return this.setTimezoneDate(dateArray, timeArray, mins_before, timezone);
  }

  private setTimezoneDate(
    date_array: number[],
    time_array: number[],
    mins_before: number,
    timezone: string
  ) {
    return moment()
      .tz(timezone)
      .year(date_array[0])
      .month(date_array[1] - 1)
      .date(date_array[2])
      .hours(time_array[0])
      .minutes(time_array[1])
      .seconds(0)
      .add(-mins_before, 'minutes')
      .toDate();
  }
}

const reminderService = new ReminderService();
export default reminderService;
