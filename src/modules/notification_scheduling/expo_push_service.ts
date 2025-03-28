import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { v4 as uuid } from 'uuid';

import { ID } from '../../../schema/database/abstract';
import { NotificationDbObject, NotificationRelatedData, NotificationType } from '../../../schema/database/notifications';
import { NotificationService } from '../../services/entity/notification_service';
import { Logger } from '../../utils/logging';

type PushNotificationParams = {
  messages: ExpoPushMessage[],
  type: NotificationType,
  to_id: ID,
  from_id?: ID,
  related_data?: NotificationRelatedData,
  related_id?: ID,
  save?: boolean
}

export class ExpoPushService {
  private expo: Expo = new Expo();
  private logger = Logger.of(ExpoPushService);

  public async pushNotificationToExpo({
    messages,
    type,
    to_id,
    from_id,
    related_data,
    related_id,
    save = true
  }: PushNotificationParams) {
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.info(`Sent message and received ticket ${JSON.stringify(ticketChunk)}`);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }

    // Store the notification event
    const sendingSuccess = tickets.every((x) => x.status === 'ok');
    const commonTitle = messages[0].title || '';
    const commonBody = messages[0].body || '';
    if (!sendingSuccess) {
      console.warn(`Sending notification to ${to_id} failed.`)
    }

    if (save) {
      const notificationService = new NotificationService();
      const dbObject: NotificationDbObject = {
        id: uuid(),
        created: new Date(),
        last_updated: new Date(),
        to: to_id,
        from: from_id,
        title: commonTitle,
        message: commonBody,
        type,
        seen: false,
        received: sendingSuccess,
        related_data,
        related_id
      }
      await notificationService.processCreation(dbObject)
    }
  }
}
