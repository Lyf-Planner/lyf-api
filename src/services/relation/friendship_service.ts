import { ID } from '#/database/abstract';
import { UserFriendshipDbObject, UserFriendshipStatus } from '#/database/user_friendships';
import { FriendshipAction } from '#/util/social';
import { UserFriendRelation } from '@/models/relation/user_friend';
import { FriendNotifications } from '@/modules/notification_scheduling/friend_notifications';
import { BaseService } from '@/services/_base_service';
import { Logger } from '@/utils/logging';
import { LyfError } from '@/utils/lyf_error';

export type FriendshipUpdate = {
  user_id: ID;
  action: FriendshipAction;
};

export class FriendshipService extends BaseService {
  public logger = Logger.of(FriendshipService.name);

  async processUpdate(from_id: ID, update: FriendshipUpdate) {
    // Can't address yourself
    if (from_id === update.user_id) {
      throw new LyfError('You cannot friend yourself', 400);
    }

    const friendship = new UserFriendRelation(from_id, update.user_id);

    switch (update.action) {
      case FriendshipAction.Accept:
        this.logger.info(`User ${from_id} accepting friend request from ${update.user_id}`);
        await this.acceptRequest(friendship);
        FriendNotifications.newFriend(friendship);
        break;
      case FriendshipAction.Block:
        this.logger.warn(`User ${from_id} blocking user ${update.user_id}`);
        await this.blockUser(friendship);
        break;
      case FriendshipAction.Request:
        this.logger.info(`User ${from_id} sending friend request to ${update.user_id}`);
        await this.requestFriendship(friendship);
        FriendNotifications.newFriendRequest(friendship);
        break;
      case FriendshipAction.Cancel:
      case FriendshipAction.Remove:
      case FriendshipAction.Decline:
        this.logger.info(`User ${from_id} removing friend request from ${update.user_id}`);
        await this.deleteFriendship(friendship);
        return null;
      default:
        throw new LyfError(`Invalid friendship update - action was ${update.action}`, 400);
    }

    // Return users' new social field
    return await friendship.export();
  }

  private async createFriendship(friendship: UserFriendRelation, status: UserFriendshipStatus) {
    const [id1, id2] = friendship.sortedIds();

    const newFriendship: UserFriendshipDbObject = {
      user1_id_fk: id1,
      user2_id_fk: id2,
      created: new Date(),
      last_updated: new Date(),
      status
    };

    try {
      await friendship.create(newFriendship, UserFriendRelation.filter);
      await friendship.getRelatedEntity().load();
    } catch (error) {
      this.logger.error('friendship record already exists', error);
      throw new LyfError(`Friendship between ${id1} and ${id2} already exists!`, 400);
    }
  }

  private async blockUser(friendship: UserFriendRelation) {
    const [id1, _id2] = friendship.sortedIds();

    const desiredStatus = friendship.id() === id1
      ? UserFriendshipStatus.BlockedByFirst
      : UserFriendshipStatus.BlockedBySecond;

    try {
      await friendship.load();
      const { status } = await friendship.extract();

      const requiredForMutualBlock = friendship.id() === id1
        ? UserFriendshipStatus.BlockedBySecond
        : UserFriendshipStatus.BlockedByFirst;

      const shouldMutualBlock = status === requiredForMutualBlock;

      if (shouldMutualBlock) {
        friendship.update({ status: UserFriendshipStatus.MutualBlock });
      } else {
        friendship.update({ status: desiredStatus });
      }

      await friendship.save()
    } catch (error) {
      this.logger.warn('Block status requested on non-existent friendship, creating now', error);
      await this.createFriendship(friendship, desiredStatus);
    }
  }

  private async requestFriendship(friendship: UserFriendRelation) {
    const [id1, _id2] = friendship.sortedIds();

    const creationStatus = friendship.id() === id1
      ? UserFriendshipStatus.PendingSecondAcceptance
      : UserFriendshipStatus.PendingFirstAcceptance;

    await this.createFriendship(friendship, creationStatus);
  }

  private async acceptRequest(friendship: UserFriendRelation) {
    await friendship.load();

    if (friendship.blocked()) {
      throw new LyfError(`Got accept request on blocked relationship ${friendship.id()} + ${friendship.entityId()}`, 400);
    }

    // Want to confirm the request is in a fertile state to be accepted. 👀
    if (friendship.pendingOnFrom()) {
      await friendship.update({ status: UserFriendshipStatus.Friends });
      await friendship.save();
    }
  }

  private async deleteFriendship(friendship: UserFriendRelation) {
    await friendship.delete();
  }
}
