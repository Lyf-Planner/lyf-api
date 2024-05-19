import { ExpoPushMessage } from 'expo-server-sdk';
import moment from 'moment-timezone';

import { ItemStatus } from '../../api/mongo_schema/list';
import { DaysOfWeek } from '../../api/mongo_schema/timetable';
import { ItemType } from '../../api/schema/database/items';
import { Item } from '../../api/schema/items';
import { ItemEntity } from '../../models/v3/entity/item_entity';
import { UserEntity } from '../../models/v3/entity/user_entity';
import mongoDb from '../../db/mongo/mongo_db';
import { formatDateData, TwentyFourHourToAMPM } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { pluralisedQuantity } from '../../utils/text';
import { ItemService } from '../entity/item_service';
import { UserService } from '../entity/user_service';
import { ExpoPushService } from './expo_push_service';

const Agenda = require('agenda');

const DEFAULT_MINS_BEFORE = '5';

export class NotificationService {
  private logger = Logger.of(NotificationService);
  private agenda = new Agenda({
    mongo: mongoDb.getDb(),
    db: { collection: 'cron-jobs' },
    processEvery: '1 minute',
    options: {
      useUnifiedTopology: true
    }
  });

  public async init() {
    this.defineEventNotification();
    this.defineRoutineNotification();
    this.defineDailyNotification();

    this.logger.info('Starting Agenda...');
    await this.agenda.start();
    this.logger.info('Agenda started.');
  }

  public async cleanup() {
    this.logger.info('Cleaning up NotificationManager');
    await this.agenda.stop();
  }

  public setEventNotification = async (item: ItemEntity, user: UserEntity, mins_before: number) => {
    if (item.isRoutine()) {
      this.setRoutineNotification(item, user);
      return;
    }

    this.throwIfInfertileItem(item.get());

    const id = this.getUniqueJobId(item.id(), user.id());
    const timezone = item.get().tz;
    const setTime = this.getScheduledTime(item, mins_before, timezone);

    // Ensure notification is for ahead of current time!
    this.logger.debug(`Notification ${id} set for ${setTime}`);
    const local_tz_time = moment().tz(timezone).toDate();
    this.logger.debug(`Item timezone time is ${local_tz_time}`);
    if (setTime < local_tz_time) {
      this.logger.info(
        `Not setting notification for ${user.id()} on item ${item.id()} - set time is past current`
      );
      return;
    }

    this.logger.info(`Creating event notification ${id} at ${setTime.toUTCString()}`);
    await this.agenda.schedule(setTime, 'Event Notification', {
      id,
      user_id: user.id(),
      item_id: item.id()
    });
  };

  public async updateEventNotification(item: ItemEntity, user: UserEntity, mins_before: number) {
    // The package does not offer a direct update method, so just recreate
    await this.removeEventNotification(item, user);
    await this.setEventNotification(item, user, mins_before);
    return;
  }

  public async removeEventNotification(item: ItemEntity, user: UserEntity) {
    this.logger.info(`Removing event notification ${item.id()}:${user.id()}`);
    var id = this.getUniqueJobId(item.id(), user.id());
    await this.agenda.cancel({ 'data.id': id });
  }

  public async setDailyNotifications(user: UserEntity, daily_time: string) {
    this.logger.info(`Setting up daily notification for ${user.id()}`);

    const timeArray = daily_time.split(':');
    const job = this.agenda.create('Daily Notification', {
      user_id: user.id()
    });

    const timezone = user.get().tz;
    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * *`, { timezone });

    await job.save();
  }

  public async updateDailyNotifications(user: UserEntity, new_daily_time: string) {
    await this.removeDailyNotifications(user);
    await this.setDailyNotifications(user, new_daily_time);
  }

  public async removeDailyNotifications(user: UserEntity) {
    this.logger.info(`Removing daily notifications for user ${user.id()}`);
    await this.agenda.cancel({ 'data.user_id': user.id() });
  }

  public async setRoutineNotification(item: ItemEntity, user: UserEntity) {
    this.logger.info(`Setting up routine notification for ${user.id()}`);

    const id = this.getUniqueJobId(item.id(), user.id());
    const job = this.agenda.create('Routine Notification', {
      id,
      user_id: user.id(),
      item_id: item.id()
    });

    const itemTime = item.get().time;
    if (!itemTime) {
      throw new Error(`Cannot set routine notification on item ${item.id()}, it has no set time.`);
    }

    const timeArray = itemTime.split(':');
    const timezone = user.get().tz;

    // We do this +1 because Sunday is treated as the zeroth day otherwise
    const day = (Object.values(DaysOfWeek).findIndex((x) => x === item.get().day) + 1) % 7;

    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * ${day}`, { timezone });
    await job.save();
  }

  public async updateRoutineNotification(item: ItemEntity, user: UserEntity) {
    await this.removeRoutineNotification(item, user);
    await this.setRoutineNotification(item, user);
  }

  public async removeRoutineNotification(item: ItemEntity, user: UserEntity) {
    this.logger.info(`Removing routine ${item.id()}:${user.id()}`);
    var id = this.getUniqueJobId(item.id(), user.id());
    await this.agenda.cancel({ 'data.id': id });
  }

  // TIMEZONE CHANGE HANDLER

  public async handleUserTzChange(user: UserEntity, new_tz: string) {
    const dailyNotifications = user.get().daily_notifications;
    const dailyNotificationTime = user.get().daily_notification_time;

    if (!dailyNotifications || !dailyNotificationTime) {
      return;
    }

    const newOffset = moment().tz(new_tz).utcOffset();
    const oldOffset = moment().tz(user.get().tz).utcOffset();

    if (oldOffset === newOffset) {
      this.logger.info(
        `User ${user.id} changed timezone but offset is equivalent - won't update notifications`
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
    this.agenda.define('Event Notification', async (job: any, done: any) => {
      var { id } = job.attrs.data;
      await this.sendItemNotification(id, true);
      done();
    });
  }

  // DAILY NOTIFICATIONS

  private defineDailyNotification() {
    this.logger.info('Defining Daily Notifications');
    this.agenda.define('Daily Notification', async (job: any, done: any) => {
      var { user_id } = job.attrs.data;

      var user = await new UserService().retrieveForUser(user_id, user_id);

      this.logger.info(`Sending daily notification to ${user_id}`);
      var subtext = await this.getUserDaily(user);
      if (!subtext) {
        done();
        return;
      }

      var message = this.formatExpoPushMessage(
        user.get().expo_tokens || [],
        'Check Your Schedule!',
        '(Daily Reminder) ' + subtext
      );
      await new ExpoPushService().pushNotificationToExpo([message]);
      done();
    });
  }

  // ROUTINE NOTIFICATIONS

  private defineRoutineNotification() {
    this.logger.info('Defining Routine Notifications');
    this.agenda.define('Routine Notification', async (job: any, done: any) => {
      var { id } = job.attrs.data;
      await this.sendItemNotification(id);
      done();
    });
  }

  // HELPERS

  private sendItemNotification = async (id: string, clearFromRelation = true) => {
    try {
      const ids = id.split(':');
      const item_id = ids[0];
      const user_id = ids[1];

      const user = await new UserService().retrieveForUser(user_id, user_id);
      const item = await new ItemService().retrieveForUser(item_id, user_id);
      const relation = await new ItemUserService().retrieveAsUserItem(item, user_id);

      if (!item || !user || !relation) {
        throw new Error(
          `Cannot send item ${item_id} notification to ${user_id} - one of item, user or relation was deleted`
        );
      }

      const to = user.get().expo_tokens || [];
      const title = item.get().title;
      const mins_before = relation.get().notification_mins_before;
      const status = item.get().status;

      if (status === ItemStatus.Cancelled) {
        this.logger.warn(`Cancelling notification for ${id} as event was cancelled`);
        await this.agenda.cancel({ 'data.id': id });
        return;
      }

      const time = item.get().time;

      if (!time) {
        this.logger.warn(`Cancelling notification for ${id} as item no longer has time`);
        await this.agenda.cancel({ 'data.id': id });
        return;
      }

      const isEvent = item.get().type === ItemType.Event;

      const subtext = mins_before
        ? `${isEvent ? 'Starting in' : 'In'} ${pluralisedQuantity(
            mins_before,
            'minute'
          )} (at ${TwentyFourHourToAMPM(time)})`
        : `${isEvent ? 'Starting now' : 'Now'} (${TwentyFourHourToAMPM(time)})`;

      this.logger.info(`Sending scheduled notification ${id} to ${user_id}`);

      const message = this.formatExpoPushMessage(to, title, subtext);
      await new ExpoPushService().pushNotificationToExpo([message]);
      await this.agenda.cancel({ 'data.id': id });

      if (clearFromRelation) {
        relation.update({ notification_mins_before: undefined });
        await new ItemUserService().update(user.id(), item.id(), {
          notification_mins_before: undefined
        });
      }
    } catch (err: any) {
      this.logger.warn(`Notification ${id} failed to send: ${err.message}`);
    }
  };

  private getUniqueJobId = (prefix: string, suffix: string) => {
    return prefix + ':' + suffix;
  };

  private formatExpoPushMessage(to: string[], title: string, body: string) {
    return {
      to,
      title,
      body,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;
  }

  // Fertile = has time date and minutes before
  private throwIfInfertileItem = (proposed: Item) => {
    if (!proposed.date || !proposed.time) {
      throw new Error('Cannot create a notification on an event without date or time');
    }
  };

  private async getUserDaily(user: UserEntity) {
    const userDate = moment().tz(user.get().tz).toDate();
    const userDateString = formatDateData(userDate);
    const userDayString = moment(userDate).format('dddd');
    const items = await new ItemUserService().retrieveItemsOnUser(
      user.id(),
      userDateString,
      userDayString
    );

    // Filter out template instantiations - will give rise to duplicates
    const parsedItems = items.filter((x) => !x.get().template_id);

    const eventCount = parsedItems.filter((x) => x.get().type === ItemType.Event).length;
    const taskCount = parsedItems.filter((x) => x.get().type === ItemType.Task).length;

    if (taskCount + eventCount === 0) {
      return user.get().persistent_daily_notification ? 'Nothing planned for today?' : '';
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
    const itemDate = item.get().date;
    const itemTime = item.get().time;

    if (!itemDate || !itemTime) {
      throw new Error(
        `Cannot set an event notification without a time and date on item ${item.id()} `
      );
    }

    var dateArray = itemDate.split('-').map((x) => parseInt(x));
    var timeArray = itemTime.split(':').map((x) => parseInt(x));
    return this.setTimezoneDate(dateArray, timeArray, mins_before, timezone);
  };

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

const notificationService = new NotificationService();
export default notificationService;
