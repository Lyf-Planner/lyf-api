import { ListItem } from "../api/list";
import { UserOperations } from "../models/userOperations";
import { UserModel } from "../models/userModel";
import expoPushService from "./expoPushService";
import { ExpoPushMessage } from "expo-server-sdk";
import { Logger } from "../utils/logging";
import moment from "moment";
import db from "../repository/dbAccess";
import { TwentyFourHourToAMPM } from "../utils/dates";
const Agenda = require("agenda");

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
    this.agenda.on("ready", async () => {
      this.logger.info("Starting Agenda");
      await this.agenda.start();
    });
  }

  public async cleanup() {
    this.logger.info("Cleaning up NotificationManager");
    await this.agenda.stop();
  }

  public setEventNotification = async (item: any, user_id: string) => {
    var id = this.getUniqueJobId(item.id, user_id);

    this.throwIfInfertile(item);
    var notification = this.getUserNotification(item, user_id);
    this.logger.info(`Creating notification ${id}`);

    var setTime = this.getScheduledTime(item, notification.minutes_before);

    var user = await UserOperations.retrieveForUser(user_id, user_id);
    this.agenda.schedule(setTime, "Event Notification", {
      id,
      to: user.getContent().expo_tokens,
      title: item.title,
      minutes_before: notification.minutes_before,
      time: item.time,
    });
  };

  private defineEventNotification() {
    this.logger.info("Defining Event Notifications");
    this.agenda.define("Event Notification", async (job: any, done: any) => {
      var { to, title, minutes_before, id, time } = job.attrs.data;
      console.log("Sending scheduled notification to", to);
      var message = this.formatExpoPushMessage(
        to,
        title,
        `Starting in ${minutes_before} minute${
          minutes_before === 1 ? "" : "s"
        } (at ${TwentyFourHourToAMPM(time)})`
      );
      await expoPushService.pushNotificationToExpo([message]);
      await this.agenda.cancel({ "data.id": id });
      done();
    });
  }

  public async updateEventNotification(item: any, user_id: string) {
    // The package does not offer a direct update method, so just recreate
    await this.removeEventNotification(item, user_id);
    await this.setEventNotification(item, user_id);
    return;
  }

  public async removeEventNotification(item: ListItem, user_id: string) {
    var id = this.getUniqueJobId(item.id, user_id);
    await this.agenda.cancel({ "data.id": id });
  }

  private getUniqueJobId = (prefix: string, suffix: string) => {
    return prefix + "|" + suffix;
  };

  private formatExpoPushMessage(to: string[], title: string, body: string) {
    return {
      to,
      title,
      body,
    } as ExpoPushMessage;
  }

  // Fertile = has time date and minutes before
  private throwIfInfertile = (proposed: any) => {
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
    return notification;
  };

  private getScheduledTime = (item: ListItem, minutes_before: string) => {
    var eventDateTime = new Date(item.date!);
    var timeArray = item.time!.split(":");
    eventDateTime.setHours(parseInt(timeArray[0]), parseInt(timeArray[1]));
    var setTime = moment(eventDateTime)
      .add(-parseInt(minutes_before), "minutes")
      .toDate();
    return setTime;
  };
}

const notificationManager = new NotificationManager();
export default notificationManager;
