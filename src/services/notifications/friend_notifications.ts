import { ExpoPushMessage } from 'expo-server-sdk';

import { UserEntity } from '../../models/entity/user_entity';
import { Logger } from '../../utils/logging';
import { ExpoPushService } from './expo_push_service';
import { ID } from '../../api/schema/database/abstract';
import { UserFriendRelation } from '../../models/relation/user_friend';

export class FriendNotifications {
  public static async newFriendRequest(friendship: UserFriendRelation) {
    const toUser = new UserEntity(friendship.id());
    const fromUser = new UserEntity(friendship.entityId());
    await toUser.load();
    await fromUser.load();

    logger.info(`Notifying ${toUser.id()} of friend request from ${fromUser.id()}`);

    const message = {
      to: toUser.getSensitive(toUser.id()).expo_tokens,
      title: 'New Friend Request',
      body: `${fromUser.name()} sent you a friend request`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    await new ExpoPushService().pushNotificationToExpo([message]);
  }

  public static async newFriend(friendship: UserFriendRelation) {
    const toUser = new UserEntity(friendship.id());
    const fromUser = new UserEntity(friendship.entityId());
    await toUser.load();
    await fromUser.load();

    logger.info(`Notifying ${toUser.id()} of accepted friend request from ${fromUser.id()}`);

    const message = {
      to: toUser.getSensitive(toUser.id()).expo_tokens,
      title: 'Friend Request Accepted',
      body: `${fromUser.name()} added you as a friend`
    };

    await new ExpoPushService().pushNotificationToExpo([message]);
  }
}

const logger = Logger.of(FriendNotifications);
