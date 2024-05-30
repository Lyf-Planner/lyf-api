import { ExpoPushMessage } from 'expo-server-sdk';

import { UserEntity } from '../../models/entity/user_entity';
import { Logger } from '../../utils/logging';
import { ExpoPushService } from './expo_push_service';

export class FriendNotifications {
  public static async newFriendRequest(to: UserEntity, from: UserEntity) {
    logger.info(`Notifying ${to.id()} of friend request from ${from.id()}`);

    const message = {
      to: to.getSensitive(to.id()).expo_tokens,
      title: 'New Friend Request',
      body: `${from.name()} sent you a friend request`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    await new ExpoPushService().pushNotificationToExpo([message]);
  }

  public static async newFriend(to: UserEntity, from: UserEntity) {
    logger.info(`Notifying ${to.id()} of accepted friend request from ${from.id()}`);

    const message = {
      to: to.getSensitive(to.id()).expo_tokens,
      title: 'Friend Request Accepted',
      body: `${from.name()} added you as a friend`
    };

    await new ExpoPushService().pushNotificationToExpo([message]);
  }
}

const logger = Logger.of(FriendNotifications);
