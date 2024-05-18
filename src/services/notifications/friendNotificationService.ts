import { ExpoPushMessage } from 'expo-server-sdk';

import { SocialUser } from '../../models/v2/social/socialUser';
import { Logger } from '../../utils/logging';
import { ExpoPushService } from './expo_push_service';

export class FriendNotifications {
  public static async newFriendRequest(to: SocialUser, from: SocialUser) {
    logger.info(`Notifying ${to.getId()} of friend request from ${from.getId()}`);

    const message = {
      to: to.getContent().expo_tokens || [],
      title: 'New Friend Request',
      body: `${from.name()} sent you a friend request`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;
    await new ExpoPushService().pushNotificationToExpo([message]);
  }

  public static async newFriend(to: SocialUser, from: SocialUser) {
    logger.info(`Notifying ${to.getId()} of accepted friend request from ${from.getId()}`);

    const message = {
      to: to.getContent().expo_tokens || [],
      title: 'Friend Request Accepted',
      body: `${from.name()} added you as a friend`
    };
    await new ExpoPushService().pushNotificationToExpo([message]);
  }
}

const logger = Logger.of(FriendNotifications);
