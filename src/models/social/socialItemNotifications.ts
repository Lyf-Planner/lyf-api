import { ExpoPushMessage } from "expo-server-sdk";
import { SocialItem } from "./socialItem";
import { SocialUser } from "./socialUser";
import { TwentyFourHourToAMPM, formatDate } from "../../utils/dates";
import { UserOperations } from "../users/userOperations";
import expoPushService from "../../notifications/expoPushService";

export class SocialItemNotifications {
  public static async newItemInvite(
    to: SocialUser,
    from: SocialUser,
    item: SocialItem
  ) {
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
    // Notify all users (except the one who joined)
    const itemContent = item.getContent();
    let usersToNotify = itemContent.permitted_users
      .map((x) => x.user_id)
      .filter((x) => x !== from.getContent().id);

    // Get all notified user push tokens
    let tokens = [] as string[];
    for (let user_id of usersToNotify) {
      let user_tokens = await UserOperations.getUserPushTokens(user_id);
      tokens.concat(user_tokens);
    }

    // Format the message
    let message = {
      to: tokens,
      title: `${from.getContent().id} joined ${itemContent.title}`,
    } as ExpoPushMessage;

    // Send
    await expoPushService.pushNotificationToExpo([message]);
  }
}
