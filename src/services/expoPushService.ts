import { Expo, ExpoPushMessage } from "expo-server-sdk";

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
var expo = new Expo({ accessToken: process.env.EXPO_NOTIFICATION_TOKEN });

export const pushNotificationToExpo = async (messages: ExpoPushMessage[]) => {
  for (var message of messages) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(message.to)) {
      console.error(`Push token ${message.to} is not a valid Expo push token`);
      continue;
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("Sent message and received ticket", ticketChunk);
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
};
