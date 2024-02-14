import { ExpoPushMessage } from "expo-server-sdk";
import { SocialItem } from "./socialItem";
import { SocialUser } from "./socialUser";
import { TwentyFourHourToAMPM, formatDate } from "../../utils/dates";
import { UserOperations } from "../users/userOperations";
import expoPushService from "../../notifications/expoPushService";
import { ID } from "../../api/abstract";
import { ItemModel } from "../items/itemModel";
import { UserAccess } from "../../api/social";
import { ListItem } from "../../api/list";
import { Logger } from "../../utils/logging";

export class SocialItemNotifications {
  public static async newItemInvite(
    to: SocialUser,
    from: SocialUser,
    item: SocialItem
  ) {
    logger.info(
      `Notifying user ${
        to.getContent().id
      } of invite to item ${item.displayName()}`
    );
    const itemContent = item.getContent();

    // Format the message
    let message = {
      to: to.getContent().expo_tokens || [],
      title: `${from.getContent().id} invited you to ${itemContent.title}`,
    } as ExpoPushMessage;

    // Include dates and times if they are set
    if (itemContent.date && itemContent.time)
      message.subtitle = `At ${TwentyFourHourToAMPM(
        itemContent.time
      )} on ${formatDate(itemContent.date)}`;
    else if (itemContent.date)
      message.subtitle = `On ${formatDate(itemContent.date)}`;

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async newItemUser(from: SocialUser, item: SocialItem) {
    logger.info(
      `Notifying users on item ${item.displayName()} of new user ${
        from.getContent().id
      }`
    );

    // Notify all users (except the one who joined)
    const itemContent = item.getContent();
    let usersToNotify = this.usersExceptFrom(
      from.getContent().id,
      itemContent.permitted_users
    );

    // Get tokens
    let tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    let message = {
      to: tokens,
      title: `${from.getContent().id} joined ${itemContent.title}`,
    } as ExpoPushMessage;

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async dateChanged(from: ID, item: ListItem) {
    const newDate = item.date;
    if (!newDate) return;

    logger.info(
      `Notifying users on item ${item.title} (${item.id}) of date change to ${newDate} from ${from}`
    );

    let usersToNotify = this.usersExceptFrom(from, item.permitted_users);

    // Get tokens
    let tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    let message = {
      to: tokens,
      title: `${from} updated the date of ${
        item.title
      } to ${TwentyFourHourToAMPM(newDate)}`,
    } as ExpoPushMessage;

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async timeChanged(from: ID, item: ListItem) {
    const newTime = item.time;
    if (!newTime) return;
    logger.info(
      `Notifying users on item ${item.title} (${item.id}) of time change to ${newTime} from ${from}`
    );

    let usersToNotify = this.usersExceptFrom(from, item.permitted_users);

    // Get tokens
    let tokens = await this.groupUserTokens(usersToNotify);

    // Format the message
    let message = {
      to: tokens,
      title: `${from} updated the time of ${
        item.title
      } to ${TwentyFourHourToAMPM(newTime)}`,
    } as ExpoPushMessage;

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }

  // Helpers
  public static usersExceptFrom(from_id: ID, permitted_users: UserAccess[]) {
    return permitted_users.map((x) => x.user_id).filter((x) => x !== from_id);
  }

  public static async groupUserTokens(usersToNotify: string[]) {
    // Get all notified user push tokens
    let tokens = [] as string[];
    for (let user_id of usersToNotify) {
      let user_tokens = await UserOperations.getUserPushTokens(user_id);
      tokens.concat(user_tokens);
    }

    return tokens;
  }
}

const logger = Logger.of(SocialItemNotifications);
