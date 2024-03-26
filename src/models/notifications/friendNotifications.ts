import { SocialUser } from "../social/socialUser";
import expoPushService from "./expoPushService";
import { Logger } from "../../utils/logging";
import { ExpoPushMessage } from "expo-server-sdk";

export class FriendNotifications {
  public static async newFriendRequest(to: SocialUser, from: SocialUser) {
    logger.info(
      `Notifying ${to.getId()} of friend request from ${from.getId()}`
    );

    let message = {
      to: to.getContent().expo_tokens || [],
      title: "New Friend Request",
      body: `${from.name()} sent you a friend request`,
      sound: { critical: true, volume: 1, name: "default" },
    } as ExpoPushMessage;
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async newFriend(to: SocialUser, from: SocialUser) {
    logger.info(
      `Notifying ${to.getId()} of accepted friend request from ${from.getId()}`
    );

    let message = {
      to: to.getContent().expo_tokens || [],
      title: "Friend Request Accepted",
      body: `${from.name()} added you as a friend`,
    };
    await expoPushService.pushNotificationToExpo([message]);
  }
}

const logger = Logger.of(FriendNotifications);
