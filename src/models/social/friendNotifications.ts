import { SocialUser } from "./socialUser";
import expoPushService from "../../notifications/expoPushService";

export class FriendNotifications {
  public static newFriendRequest(to: SocialUser, from: SocialUser) {
    let message = {
      to: to.getContent().expo_tokens || [],
      title: `${from.getContent().id} sent you a friend request`,
    };
    expoPushService.pushNotificationToExpo([message]);
  }

  public static newFriend(to: SocialUser, from: SocialUser) {
    let message = {
      to: to.getContent().expo_tokens || [],
      title: `${from.getContent().id} added you as a friend`,
    };
    expoPushService.pushNotificationToExpo([message]);
  }
}
