import { ExpoPushMessage } from 'expo-server-sdk';

import { NotificationRelatedData, NotificationType } from '../../../schema/database/notifications';
import { UserEntity } from '../../models/entity/user_entity';
import { UserFriendRelation } from '../../models/relation/user_friend';
import { Logger } from '../../utils/logging';

import { ExpoPushService } from './expo_push_service';

export class FriendNotifications {
  public static async newFriendRequest(friendship: UserFriendRelation) {
    const toUser = new UserEntity(friendship.entityId());
    const fromUser = new UserEntity(friendship.id());
    await toUser.load();
    await fromUser.load();

    logger.info(`Notifying ${toUser.id()} of friend request from ${fromUser.id()}`);

    const message = {
      to: toUser.getSensitive(toUser.id()).expo_tokens,
      title: 'New Friend Request',
      body: `${fromUser.name()} sent you a friend request`,
      sound: { critical: true, volume: 1, name: 'default' }
    } as ExpoPushMessage;

    await new ExpoPushService().pushNotificationToExpo({
      messages: [message],
      type: NotificationType.UserSocial,
      to_id: toUser.id(),
      from_id: fromUser.id(),
      related_data: NotificationRelatedData.User,
      related_id: fromUser.id()
    });
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

    await new ExpoPushService().pushNotificationToExpo({
      messages: [message],
      type: NotificationType.UserSocial,
      to_id: toUser.id(),
      from_id: fromUser.id(),
      related_data: NotificationRelatedData.User,
      related_id: fromUser.id()
    });
  }
}

const logger = Logger.of(FriendNotifications.name);
