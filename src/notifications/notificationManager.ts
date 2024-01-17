import { ListItem, ListItemTypes } from "../api/list";
import { UserOperations } from "../models/userOperations";
import { UserModel } from "../models/userModel";
import expoPushService from "./expoPushService";
import { ExpoPushMessage } from "expo-server-sdk";
import { Logger } from "../utils/logging";
import moment from "moment";
import db from "../repository/dbAccess";
import { TwentyFourHourToAMPM, formatDateData } from "../utils/dates";
import { ItemOperations } from "../models/ItemOperations";
import { User } from "../api/user";
import { DaysOfWeek } from "../api/timetable";
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

  public setEventNotification = async (item: any, user_id: string) => {
    if (ItemOperations.isTemplate(item)) {
      this.setRoutineNotification(item, user_id);
      return;
    }
    var id = this.getUniqueJobId(item.id, user_id);

    this.throwIfInfertileEvent(item);
    var notification = this.getUserNotification(item, user_id);

    var setTime = this.getScheduledTime(item, notification.minutes_before);

    // Don't schedule where time has already passed
    if (setTime < new Date()) return;

    this.logger.info(`Creating event notification ${id}`);
    await this.agenda.schedule(setTime, "Event Notification", {
      id,
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
      if (!subtext) return;

      var message = this.formatExpoPushMessage(
        user.getContent().expo_tokens || [],
        "Today's Schedule",
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
    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * *`);
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
    const job = this.agenda.create("Routine Notification", {
      id,
    });

    var timeArray = item.time!.split(":");

    // We do this +1 because Sunday is treated as the zeroth day
    const day =
      (Object.values(DaysOfWeek).findIndex((x) => x === item.day) + 1) % 7;
    job.repeatEvery(`${timeArray[1]} ${timeArray[0]} * * ${day}`);
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

      const minutes_before = parseInt(notification.minutes_before);
      const time = item.getContent().time!;

      this.logger.info(`Sending scheduled notification ${id} to ${user_id}`);
      var message = this.formatExpoPushMessage(
        to,
        title,
        `Starting in ${minutes_before} minute${
          minutes_before === 1 ? "" : "s"
        } (at ${TwentyFourHourToAMPM(time)})`
      );
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
    var items = await ItemOperations.getRawUserItems(
      userItemIds,
      user.getContent().id
    );
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
        ? "You have nothing planned for today :)"
        : "";
    } else if (eventCount === 0) {
      return `You have ${taskCount} task${
        taskCount === 1 ? "" : "s"
      } on today :)`;
    } else if (taskCount === 0) {
      return `You have ${eventCount} events${
        eventCount === 1 ? "" : "s"
      } on today :)`;
    } else {
      return `You have ${eventCount} event${
        eventCount === 1 ? "" : "s"
      } and ${taskCount} task${taskCount === 1 ? "" : "s"} on today :)`;
    }
  }

  private getScheduledTime = (item: ListItem, minutes_before: string) => {
    var eventDateTime = new Date(item.date!);
    var timeArray = item.time!.split(":");
    eventDateTime.setHours(parseInt(timeArray[0]), parseInt(timeArray[1]));
    var setTime = moment(eventDateTime)
      .add(-parseInt(minutes_before), "minutes")
      .toDate();
    return setTime;
  };

  private setDefaultMinsIfEmpty = (notification: any) => {
    if (!notification.minutes_before)
      notification.minutes_before = DEFAULT_MINS_BEFORE;
  };
}

const notificationManager = new NotificationManager();
export default notificationManager;
