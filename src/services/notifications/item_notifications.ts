import { ExpoPushMessage } from 'expo-server-sdk';
import debouncer from 'signature-debouncer';

import { ItemStatus } from '../../api/schema/database/items';
import { ItemEntity } from '../../models/entity/item_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { formatDate, TwentyFourHourToAMPM } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { ExpoPushService } from './expo_push_service';
import { NotificationType } from '../../api/schema/database/notifications';

export enum DebounceSignatures {
  'DateChange' = 'DateChange',
  'TimeChange' = 'TimeChange',
  'StatusChange' = 'StatusChange'
}

export class SocialItemNotifications {
  static async handleDateChange(from: UserEntity, item: ItemEntity) {
    const newDate = item.date();
    if (!newDate) {
      return;
    }

    logger.info(
      `Notifying users on item ${item.title()} (${
        item.id()
      }) of date change to ${newDate} from ${from.id()}`
    );

    const users = await item.getUsers();

    users.forEach(async (user) => {
      if (user.id() === from.id()) {
        return;
      }

      const message = {
        to: user.getSensitive(user.id()).expo_tokens,
        title: `${item.type()} date updated`,
        body: `${from.name()} updated the date of ${item.title()} to ${formatDate(item.date()!)}`,
        sound: { critical: true, volume: 1, name: 'default' }
      } as ExpoPushMessage;

      const func = async () => await new ExpoPushService().pushNotificationToExpo(
        [message],
        NotificationType.ItemSocial,
        user.id(),
        from.id()
      );

      SocialItemNotifications.debounceItemMessage(
        func,
        item.id(),
        from.id(),
        DebounceSignatures.TimeChange
      );
    })
  }

  static async handleTimeChange(from: UserEntity, item: ItemEntity) {
    const newTime = item.time();
    if (!newTime) {
      return;
    }
    logger.info(
      `Notifying users on item ${item.name()} of time change to ${newTime} from ${from.id()}`
    );

    const users = await item.getUsers();

    users.forEach(async (user) => {
      if (user.id() === from.id()) {
        return;
      }

      const message = {
        to: user.getSensitive(user.id()).expo_tokens,
        title: `${item.type()} time updated`,
        body: `${from.name()} updated the time of ${item.title()} to ${TwentyFourHourToAMPM(newTime)}`,
        sound: { critical: true, volume: 1, name: 'default' }
      } as ExpoPushMessage;

      const func = async () => await new ExpoPushService().pushNotificationToExpo(
        [message],
        NotificationType.ItemSocial,
        user.id(),
        from.id()
      );

      SocialItemNotifications.debounceItemMessage(
        func,
        item.id(),
        from.id(),
        DebounceSignatures.TimeChange
      );
    })
  }

  static async newItemInvite(to: UserEntity, from: UserEntity, item: ItemEntity) {
    logger.info(`Notifying user ${to.id()} of invite to item ${item.name()}`);

    // Format the message
    const message = {
      to: to.getSensitive(to.id()).expo_tokens,
      title: `New ${item.type()} Invite`,
      body: `${from.name()} invited you to ${item.title()}`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    // Include dates and times if they are set
    if (item.isFullyScheduled()) {
      message.body += ` at ${TwentyFourHourToAMPM(item.time()!)} on ${formatDate(item.date()!)}`;
    } else if (item.date()) {
      message.body += ` on ${formatDate(item.date()!)}`;
    }

    // Send
    await new ExpoPushService().pushNotificationToExpo(
      [message],
      NotificationType.ItemSocial,
      to.id(),
      from.id()
    );
  }

  static async newItemUser(from: UserEntity, item: ItemEntity) {
    logger.info(`Notifying users on item ${item.name()} of new user ${from.id()}`);

    const users = await item.getUsers();

    users.forEach(async (user) => {
      const message = {
        to: user.getSensitive(user.id()).expo_tokens,
        title: `User Joined your ${item.type()}`,
        body: `${from.name()} joined ${item.title()}`
      } as ExpoPushMessage;

      await new ExpoPushService().pushNotificationToExpo(
        [message],
        NotificationType.ItemSocial,
        user.id(),
        from.id()
      );
    })
  }

  static async handleStatusChange(from: UserEntity, item: ItemEntity) {
    const newStatus = item.status();
    if (!newStatus) {
      return;
    }

    const statusChangeRelevant = newStatus === ItemStatus.Done || newStatus === ItemStatus.Cancelled;
    if (!statusChangeRelevant) {
      return;
    }

    const users = await item.getUsers();

    logger.info(
      `Notifying ${users} other users on item ${item.title()} (${
        item.id()
      }) of status change to ${newStatus} from ${from.id()}`
    );

    users.forEach(async (user) => {
      if (user.id() === from.id()) {
        return;
      }

      const message = {
        to: user.getSensitive(user.id()).expo_tokens,
        title: `${item.type()} ${item.status()}`,
        body: `${from.name()} marked ${item.title()} as ${newStatus}`,
        sound: { critical: true, volume: 1, name: 'default' }
      } as ExpoPushMessage;

      const func = async () => await new ExpoPushService().pushNotificationToExpo(
        [message],
        NotificationType.ItemSocial,
        user.id(),
        from.id()
      );

      SocialItemNotifications.debounceItemMessage(
        func,
        item.id(),
        from.id(),
        DebounceSignatures.TimeChange
      );
    })
  }

  static debounceItemMessage(
    func: () => Promise<void>,
    item_id: string,
    user_id: string,
    category: DebounceSignatures
  ) {
    debouncer.run(
      async () => await func(),
      {
        item_id,
        user_id,
        type: category
      },
      10000
    );
  }
}

const logger = Logger.of(SocialItemNotifications);
