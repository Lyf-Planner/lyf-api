import { ItemStatus, ListItem, ListItemTypes } from "../api/list";
import { UserOperations } from "../models/users/userOperations";
import { UserModel } from "../models/users/userModel";
import { ExpoPushMessage } from "expo-server-sdk";
import { Logger } from "../utils/logging";
import { TwentyFourHourToAMPM, formatDateData } from "../utils/dates";
import { ItemOperations } from "../models/items/ItemOperations";
import { User } from "../api/user";
import { DaysOfWeek } from "../api/timetable";
import { pluralisedQuantity } from "../utils/text";
import expoPushService from "./expoPushService";
import moment from "moment-timezone";
import db from "../repository/dbAccess";

const Agenda = require("agenda");

const DEFAULT_MINS_BEFORE = "5";

export class NotificationManager {
  private logger = Logger.of(NotificationManager);
  private agenda = new Agenda({
    mongo: db.getDb(),
    db: { collection: "cron-jobs" },
    processEvery: "1 minute",
    options: {
      useUnifiedTopology: true,
    },
  });

  constructor() {
    this.defineEventNotification();
    this.defineRoutineNotification();
    this.defineDailyNotification();
    this.agenda.on("ready", async () => {
      this.logger.info("Starting Agenda...");
      await this.agenda.start();
      this.logger.info("Agenda started.");
    });
  }

  public async cleanup() {
    this.logger.info("Cleaning up NotificationManager");
    await this.agenda.stop();
  }

  // EVENT NOTIFICATIONS

  private defineEventNotification() {
    this.logger.info("Defining Event Notifications");
    this.agenda.define("Event Notification", async (job: any, done: any) => {
      var { id } = job.attrs.data;
      await this.sendItemNotification(id, true);
      done();
    });
  }

  public setEventNotification = async (
    item: any,
    user_id: string,
    send_if_passed: boolean = false
  ) => {
    if (ItemOperations.isTemplate(item)) {
      this.setRoutineNotification(item, user_id);
      return;
    }
    var id = this.getUniqueJobId(item.id, user_id);

    this.throwIfInfertileEvent(item);
    const user = (
      await UserOperations.retrieveForUser(user_id, user_id)
    ).getContent();
    const notification = this.getUserNotification(item, user_id);
    const timezone = user.timezone || (process.env.TZ as string);
    var setTime = this.getScheduledTime(
      item,
      notification.minutes_before,
      timezone
    );

    // Ensure notification is for ahead of current time!
    this.logger.debug(`Notification ${id} set for ${setTime}`);
    const local_tz_time = moment().tz(timezone).toDate();
    this.logger.debug(`Local time is ${local_tz_time}`);
    if (setTime < local_tz_time && !send_if_passed) {
      this.logger.info(
        `Not setting notification for ${user_id} on item ${item.id} - set time is past current`
      );
      return;
    }

    this.logger.info(
      `Creating event notification ${id} at ${setTime.toUTCString()}`
    );
    await this.agenda.schedule(setTime, "Event Notification", {
      id,
      user_id,
      item_id: item.id,
    });
  };

  public async updateEventNotification(item: any, user_id: string) {
    // The package does not offer a direct update method, so just recreate
    await this.removeEventNotification({ ...item }, user_id);
    await this.setEventNotification({ ...item }, user_id);
    return;
  }

  public async removeEventNotification(item: ListItem, user_id: string) {
    this.logger.info(`Removing event ${item.id}:${user_id}`);
    var id = this.getUniqueJobId(item.id, user_id);
    await this.agenda.cancel({ "data.id": id });
  }

  // DAILY NOTIFICATIONS

  private defineDailyNotification() {
    this.logger.info("Defining Daily Notifications");
    this.agenda.define("Daily Notification", async (job: any, done: any) => {
      var { user_id } = job.attrs.data;

      var user = await UserOperations.retrieveForUser(user_id, user_id);

      this.logger.info(`Sending daily notification to ${user_id}`);
      var subtext = await this.getUserDaily(user);
      if (!subtext) {
        done();
        return;
      }

      var message = this.formatExpoPushMessage(
        user.getContent().expo_tokens || [],
        "Check Your Schedule",
        subtext
      );
      await expoPushService.pushNotificationToExpo([message]);
      done();
    });
  }

  public async setDailyNotifications(user: User) {
    this.logger.info(`Setting up daily notification for ${user.id}`);
    var time = user.premium?.notifications?.daily_notification_time;

    var timeArray = time!.split(":");
    const job = this.agenda.create("Daily Notification", {
      user_id: user.id,
    });
    const timezone = user.timezone || process.env.TZ;
    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * *`, { timezone });

    await job.save();
  }

  public async updateDailyNotifications(user: User) {
    var id = user.id;
    await this.removeDailyNotifications(id);
    await this.setDailyNotifications(user);
  }

  public async removeDailyNotifications(user_id: string) {
    this.logger.info(`Removing daily notifications for user ${user_id}`);
    await this.agenda.cancel({ "data.user_id": user_id });
  }

  // ROUTINE NOTIFICATIONS

  private defineRoutineNotification() {
    this.logger.info("Defining Routine Notifications");
    this.agenda.define("Routine Notification", async (job: any, done: any) => {
      var { id } = job.attrs.data;
      await this.sendItemNotification(id);
      done();
    });
  }

  public async setRoutineNotification(item: ListItem, user_id: string) {
    this.logger.info(`Setting up routine notification for ${user_id}`);

    var id = this.getUniqueJobId(item.id, user_id);
    var user = (
      await UserOperations.retrieveForUser(user_id, user_id)
    ).getContent();
    const job = this.agenda.create("Routine Notification", {
      id,
      user_id,
      item_id: item.id,
    });

    var timeArray = item.time!.split(":");
    const timezone = user.timezone || process.env.TZ;

    // We do this +1 because Sunday is treated as the zeroth day otherwise
    const day =
      (Object.values(DaysOfWeek).findIndex((x) => x === item.day) + 1) % 7;
    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * ${day}`, { timezone });
    await job.save();
  }

  public async updateRoutineNotification(item: ListItem, user_id: string) {
    await this.removeRoutineNotification(item, user_id);
    await this.setRoutineNotification(item, user_id);
  }

  public async removeRoutineNotification(item: ListItem, user_id: string) {
    this.logger.info(`Removing routine ${item.id}:${user_id}`);
    var id = this.getUniqueJobId(item.id, user_id);
    await this.agenda.cancel({ "data.id": id });
  }

  // TIMEZONE CHANGE HANDLER

  public async handleUserTzChange(user: User, old_tz: string) {
    // Don't run if the offset is the same
    const newOffset = moment()
      .tz(user.timezone || (process.env.TZ as string))
      .utcOffset();
    const oldOffset = moment().tz(old_tz).utcOffset();
    if (oldOffset === newOffset) {
      this.logger.info(
        `User ${user.id} changed timezone but offset is equivalent - won't update notifications`
      );
      return;
    }

    this.logger.info(
      `Adjusting notification timezones for user ${user.id} to ${user.timezone}`
    );

    const jobs = await db
      .getDb()
      .collection("cron-jobs")
      .find({ "data.user_id": user.id })
      .toArray();

    for (let job of jobs) {
      let itemObj;
      switch (job.name) {
        case "Event Notification":
          itemObj = (
            await ItemOperations.retrieveForUser(job.data.item_id, user.id)
          ).getContent();
          await this.removeEventNotification({ ...itemObj }, user.id);
          await this.setEventNotification({ ...itemObj }, user.id, true);
          break;

        case "Daily Notification":
          await this.updateDailyNotifications(user);
          break;

        case "Routine Notification":
          itemObj = (
            await ItemOperations.retrieveForUser(job.data.item_id, user.id)
          ).getContent();
          await this.updateRoutineNotification({ ...itemObj }, user.id);
          break;
      }
    }
  }

  // HELPERS

  private sendItemNotification = async (id: string, clearFromItem = false) => {
    try {
      const ids = id.split(":");
      const item_id = ids[0];
      const user_id = ids[1];

      const user = await UserOperations.retrieveForUser(user_id, user_id);
      if (!user) return;
      const to = user.getContent().expo_tokens || [];

      const item = await ItemOperations.retrieveForUser(item_id, user_id);
      const title = item.getContent().title;
      const notification = this.getUserNotification(item.getContent(), user_id);
      const status = item.getContent().status;
      if (status === ItemStatus.Cancelled) {
        this.logger.warn(
          `Cancelling notification for ${id} as event was cancelled`
        );
        await this.agenda.cancel({ "data.id": id });
        return;
      }

      const minutes_before = parseInt(notification.minutes_before);
      const time = item.getContent().time!;
      const isEvent = item.getContent().type === ListItemTypes.Event;
      var subtext = minutes_before
        ? `${isEvent ? "Starting in" : "In"} ${pluralisedQuantity(
            minutes_before,
            "minute"
          )} (at ${TwentyFourHourToAMPM(time)})`
        : `${isEvent ? "Starting now" : "Now"} (${TwentyFourHourToAMPM(time)})`;

      this.logger.info(`Sending scheduled notification ${id} to ${user_id}`);
      var message = this.formatExpoPushMessage(to, title, subtext);
      await expoPushService.pushNotificationToExpo([message]);
      await this.agenda.cancel({ "data.id": id });

      if (clearFromItem) await item.clearNotification(user_id);
    } catch (err: any) {
      this.logger.warn(`Notification ${id} failed to send: ${err.message}`);
    }
  };

  private getUniqueJobId = (prefix: string, suffix: string) => {
    return prefix + ":" + suffix;
  };

  private formatExpoPushMessage(to: string[], title: string, body: string) {
    return {
      to,
      title,
      body,
      sound: { critical: true, volume: 1, name: "default" },
    } as ExpoPushMessage;
  }

  // Fertile = has time date and minutes before
  private throwIfInfertileEvent = (proposed: any) => {
    if (!proposed.date || !proposed.time)
      throw new Error(
        "Cannot create a notification on an event without date or time"
      );
  };

  private getUserNotification = (item: ListItem, user_id: string) => {
    var notification = item.notifications.find((x) => x.user_id === user_id);
    if (!notification)
      throw new Error(
        `Server Error; Event notification cannot be setup if user has no event notification data`
      );
    if (!notification.minutes_before) {
      this.logger.warn(
        `Item ${item.id} had a notification for user ${user_id} with no minutes_before!`
      );
      this.setDefaultMinsIfEmpty(notification);
    }
    return notification;
  };

  private async getUserDaily(user: UserModel) {
    var userItemIds = user
      .getContent()
      .timetable?.items.map((x) => x.id) as any;
    var items = await ItemOperations.getRawUserItems(userItemIds, user.getId());
    const curDay = moment().format("dddd");
    const curDate = formatDateData(new Date());
    items = items.filter(
      (x) => x.day === curDay || (x.date === curDate && !x.template_id)
    );

    const eventCount = items.filter(
      (x) => x.type === ListItemTypes.Event
    ).length;
    const taskCount = items.filter((x) => x.type === ListItemTypes.Task).length;

    // I know it doesn't look pretty, okay.
    if (taskCount + eventCount === 0) {
      return user.getContent().premium?.notifications
        ?.persistent_daily_notification
        ? "Nothing planned for today :)"
        : "";
    } else if (eventCount === 0) {
      return `You have ${pluralisedQuantity(taskCount, "task")} on today`;
    } else if (taskCount === 0) {
      return `You have ${pluralisedQuantity(eventCount, "event")} on today`;
    } else {
      return `You have ${pluralisedQuantity(
        eventCount,
        "event"
      )} and ${pluralisedQuantity(taskCount, "task")} on today`;
    }
  }

  private getScheduledTime = (
    item: ListItem,
    minutes_before: string,
    timezone: string
  ) => {
    var dateArray = item.date!.split("-").map((x) => parseInt(x));
    var timeArray = item.time!.split(":").map((x) => parseInt(x));
    return this.setTimezoneDate(dateArray, timeArray, minutes_before, timezone);
  };

  private setTimezoneDate(
    date_array: number[],
    time_array: number[],
    minutes_before: string,
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
      .add(-parseInt(minutes_before), "minutes")
      .toDate();
  }

  private setDefaultMinsIfEmpty = (notification: any) => {
    if (!notification.minutes_before)
      notification.minutes_before = DEFAULT_MINS_BEFORE;
  };
}

const notificationManager = new NotificationManager();
export default notificationManager;
