import { ExpoPushMessage } from 'expo-server-sdk';
import debouncer from 'signature-debouncer';

import { ItemStatus, ListItem } from '../../api/mongo_schema/list';
import { formatDate, TwentyFourHourToAMPM } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { ItemOperations } from '../items/ItemOperations';
import { SocialItem } from '../social/socialItem';
import { SocialUser } from '../social/socialUser';
import { UserModel } from '../users/userModel';
import { UserOperations } from '../users/userOperations';
import expoPushService from './expoPushService';

export enum DebounceCategories {
  'DateChange' = 'DateChange',
  'TimeChange' = 'TimeChange',
  'StatusChange' = 'StatusChange'
}

export class SocialItemNotifications {
  public static async newItemInvite(
    to: SocialUser,
    from: SocialUser,
    item: SocialItem
  ) {
    logger.info(
      `Notifying user ${to.getId()} of invite to item ${item.displayName()}`
    );
    const itemContent = item.getContent();

    // Format the message
    const message = {
      to: to.getContent().expo_tokens || [],
      title: `New ${item.getContent().type} Invite`,
      body: `${from.name()} invited you to ${itemContent.title}`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    // Include dates and times if they are set
    if (itemContent.date && itemContent.time) {
      message.body += ` at ${TwentyFourHourToAMPM(
        itemContent.time
      )} on ${formatDate(itemContent.date)}`;
    } else if (itemContent.date) {
      message.body += ` on ${formatDate(itemContent.date)}`;
 }

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async newItemUser(from: SocialUser, item: SocialItem) {
    logger.info(
      `Notifying users on item ${item.displayName()} of new user ${from.getId()}`
    );

    // Notify all users (except the one who joined)
    const itemContent = item.getContent();
    const usersToNotify = ItemOperations.usersExceptFrom(
      from.getId(),
      itemContent
    );

    // Get tokens
    const tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    const message = {
      to: tokens,
      title: `User Joined your ${item.getContent().type}`,
      body: `${from.name()} joined ${itemContent.title}`
    } as ExpoPushMessage;

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async dateChanged(from: UserModel, item: ListItem) {
    const newDate = item.date;
    if (!newDate) { return; }

    logger.info(
      `Notifying users on item ${item.title} (${
        item.id
      }) of date change to ${newDate} from ${from.getId()}`
    );

    const usersToNotify = ItemOperations.usersExceptFrom(from.getId(), item);

    // Get tokens
    const tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    const message = {
      to: tokens,
      title: `${item.type} date updated`,
      body: `${from.name()} updated the date of ${item.title} to ${formatDate(
        item.date!
      )}`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    // Send
    SocialItemNotifications.debounceItemMessage(
      message,
      item.id,
      from.getId(),
      DebounceCategories.DateChange
    );
  }

  public static async timeChanged(from: UserModel, item: ListItem) {
    const newTime = item.time;
    if (!newTime) { return; }
    logger.info(
      `Notifying users on item ${item.title} (${
        item.id
      }) of time change to ${newTime} from ${from.getId()}`
    );

    const usersToNotify = ItemOperations.usersExceptFrom(from.getId(), item);

    // Get tokens
    const tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    const message = {
      to: tokens,
      title: `${item.type} time updated`,
      body: `${from.name()} updated the time of ${
        item.title
      } to ${TwentyFourHourToAMPM(newTime)}`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    // Send
    SocialItemNotifications.debounceItemMessage(
      message,
      item.id,
      from.getId(),
      DebounceCategories.TimeChange
    );
  }

  public static async statusChanged(from: UserModel, item: ListItem) {
    const newStatus = item.status;
    if (!newStatus) { return; }

    const usersToNotify = ItemOperations.usersExceptFrom(from.getId(), item);
    if (usersToNotify.length === 0) { return; }

    logger.info(
      `Notifying ${usersToNotify.length} other users on item ${item.title} (${
        item.id
      }) of status change to ${newStatus} from ${from.getId()}`
    );

    // Get tokens
    const tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    const message = {
      to: tokens,
      title: `${item.type} ${
        item.status === ItemStatus.Done ? 'Completed!' : item.status
      }`,
      body: `${from.name()} marked ${item.title} as ${newStatus}`,
      sound: {
        critical: item.status === ItemStatus.Cancelled,
        volume: 1,
        name: 'default'
      }
    } as ExpoPushMessage;

    // Send
    SocialItemNotifications.debounceItemMessage(
      message,
      item.id,
      from.getId(),
      DebounceCategories.StatusChange
    );
  }

  // Helpers
  public static async groupUserTokens(usersToNotify: string[]) {
    // Get all notified user push tokens
    let tokens = [] as string[];
    for (const user_id of usersToNotify) {
      const user_tokens = await UserOperations.getUserPushTokens(user_id);
      tokens = tokens.concat(user_tokens);
    }

    return tokens;
  }

  public static debounceItemMessage(
    message: ExpoPushMessage,
    item_id: string,
    user_id: string,
    category: DebounceCategories
  ) {
    debouncer.run(
      async () => await expoPushService.pushNotificationToExpo([message]),
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
