import { ExpoPushMessage, ExpoPushToken } from "expo-server-sdk";
import { EventNotification } from "../schema/user";
import { pushNotificationToExpo } from "./expoPushService";
import moment from "moment";
import { Logger } from "../utils/logging";

// When we need to start scaling this:
// - Consider SQS
// - Store queue in NoSQL database as an object, where there is a key for any minute (use iso string) with an event
// - Then can easily read and write when necessary

export class EventNotificationManager {
  private eventsQueue: EventNotification[] = [];
  private refreshCallback?: () => void;

  public init() {
    var refresh = setInterval(() => this.refreshQueue(), 60 * 1000);
    this.refreshCallback = () => clearInterval(refresh);
  }

  public cleanUp() {
    this.refreshCallback && this.refreshCallback();
  }

  private refreshQueue() {
    logger.debug("Checking event notification queue");
    var now = this.nearestMinute();

    if (this.eventsQueue.length === 0) return;
    while (this.eventsQueue[0].scheduled_for! <= now) {
      let poppedEvent = this.eventsQueue.shift()!;
      logger.debug(`Publishing event ${poppedEvent.event_name}`);
      this.publish(poppedEvent);
    }
  }

  private nearestMinute(electedDate?: Date) {
    var coeff = 1000 * 60 * 5;
    var date = electedDate || new Date(); //or use any other date
    return new Date(Math.round(date.getTime() / coeff) * coeff);
  }

  public enqueue(eventNotification: EventNotification, token: ExpoPushToken) {
    this.appendToken(eventNotification, token);
    this.appendScheduledTime(eventNotification);

    var scheduledTime = eventNotification.scheduled_for?.getTime()!;
    for (let i in this.eventsQueue) {
      if (this.eventsQueue[i].scheduled_for?.getTime()! > scheduledTime) {
        this.eventsQueue.splice(parseInt(i) - 1, 0, eventNotification);
        break;
      }
    }
  }

  private appendScheduledTime(eventNotification: EventNotification) {
    var subtractedMinutes = -parseInt(eventNotification.minutes_away);
    var scheduledFor = moment(eventNotification.event_datetime)
      .add(subtractedMinutes, "minutes")
      .toDate();
    eventNotification.scheduled_for = scheduledFor;
  }
  private appendToken = (
    eventNotification: EventNotification,
    token: ExpoPushToken
  ) => (eventNotification.to = token);

  private async publish(message: EventNotification) {
    var pushMessage = this.processForPublishing(message);
    await pushNotificationToExpo([pushMessage]);
  }

  // Convert to ExpoPushMessage
  private processForPublishing(
    notification: EventNotification
  ): ExpoPushMessage {
    return {
      to: notification.to as string,
      title: notification.event_name,
      subtitle: `Starting in ${this.parseMinutesAway(
        notification.minutes_away
      )}`,
    };
  }

  private parseMinutesAway(minutes: string) {
    var numMinutes = parseInt(minutes);
    var hours = Math.floor(numMinutes / 60);
    var remainingMins = numMinutes % 60;

    if (hours > 0)
      return `1 hour${hours === 1 ? "" : "s"} and ${remainingMins} minutes`;
    else return `$${remainingMins} minutes`;
  }
}

const logger = Logger.of(EventNotificationManager);
