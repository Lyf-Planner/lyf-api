import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { Logger } from "../../utils/logging";

export class ExpoNotificationService {
  private expo: Expo;
  private logger = Logger.of(ExpoNotificationService);

  constructor(expo: Expo) {
    this.expo = expo;
  }

  public async pushNotificationToExpo(messages: ExpoPushMessage[]) {
    for (var message of messages) {
      // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
      // Check that all your push tokens appear to be valid Expo push tokens
      for (let token of message.to) {
        if (!Expo.isExpoPushToken(token)) {
          this.logger.error(
            `Push token ${token} is not a valid Expo push token`
          );
          continue;
        }
      }

      let chunks = this.expo.chunkPushNotifications(messages);
      let tickets = [];

      for (let chunk of chunks) {
        try {
          let ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          this.logger.info(
            `Sent message and received ticket ${JSON.stringify(ticketChunk)}`
          );
          tickets.push(...ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
          console.error(error);
        }
      }

      // STORE TICKETS!
    }
  }
}

var expo = new Expo();
const expoPushService = new ExpoNotificationService(expo);

export default expoPushService;
