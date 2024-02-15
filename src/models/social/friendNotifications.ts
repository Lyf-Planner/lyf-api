import { SocialUser } from "./socialUser";
import expoPushService from "../../notifications/expoPushService";
import { Logger } from "../../utils/logging";

export class FriendNotifications {
  public static async newFriendRequest(to: SocialUser, from: SocialUser) {
    logger.info(
      `Notifying ${to.getContent().id} of friend request from ${
        from.getContent().id
      }`
    );

    let message = {
      to: to.getContent().expo_tokens || [],
      title: "New Friend Request",
      body: `${from.getContent().id} sent you a friend request`,
    };
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async newFriend(to: SocialUser, from: SocialUser) {
    logger.info(
      `Notifying ${to.getContent().id} of accepted friend request from ${
        from.getContent().id
      }`
    );

    let message = {
      to: to.getContent().expo_tokens || [],
      title: "Friend Request Accepted",
      body: `${from.getContent().id} added you as a friend`,
    };
    await expoPushService.pushNotificationToExpo([message]);
  }
}

const logger = Logger.of(FriendNotifications);
