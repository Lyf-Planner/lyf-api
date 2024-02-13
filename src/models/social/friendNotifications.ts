import { SocialUser } from "./socialUser";
import expoPushService from "../../notifications/expoPushService";

export class FriendNotifications {
  public static async newFriendRequest(to: SocialUser, from: SocialUser) {
    let message = {
      to: to.getContent().expo_tokens || [],
      title: `${from.getContent().id} sent you a friend request`,
    };
    await expoPushService.pushNotificationToExpo([message]);
  }

  public static async newFriend(to: SocialUser, from: SocialUser) {
    let message = {
      to: to.getContent().expo_tokens || [],
      title: `${from.getContent().id} added you as a friend`,
    };
    await expoPushService.pushNotificationToExpo([message]);
  }
}
