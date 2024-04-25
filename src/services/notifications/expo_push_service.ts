import { Expo, ExpoPushMessage } from 'expo-server-sdk';

import { Logger } from '../../utils/logging';

export class ExpoPushService {
  private expo: Expo = new Expo();
  private logger = Logger.of(ExpoPushService);

  public async pushNotificationToExpo(messages: ExpoPushMessage[]) {
    for (var message of messages) {
      // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
      // Check that all your push tokens appear to be valid Expo push tokens
      for (const token of message.to) {
        if (!Expo.isExpoPushToken(token)) {
          this.logger.error(`Push token ${token} is not a valid Expo push token`);
          continue;
        }
      }

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          this.logger.info(`Sent message and received ticket ${JSON.stringify(ticketChunk)}`);
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
