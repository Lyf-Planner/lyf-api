import { ID } from '../../api/schema/database/abstract';
import { UserFriendshipDbObject, UserFriendshipStatus } from '../../api/schema/database/user_friendships';
import { FriendshipAction } from '../../api/schema/util/social';
import { ExposedUser } from '../../api/schema/user';
import { UserEntity } from '../../models/entity/user_entity';
import { UserFriendRelation } from '../../models/relation/user_friend';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { BaseService } from '../_base_service';
import { UserService } from '../entity/user_service';
import { FriendNotifications } from '../notifications/friend_notifications';

export type FriendshipUpdate = {
  user_id: ID;
  action: FriendshipAction;
};

export class FriendshipService extends BaseService {
  public logger = Logger.of(FriendshipService);

  async processUpdate(from: ID, update: FriendshipUpdate) {
    // Can't address yourself
    if (from === update.user_id) {
      throw new LyfError('You cannot friend yourself', 400);
    }

    const userService = new UserService();

    const fromUser = await userService.getEntity(from);
    const targetUser = await userService.getEntity(update.user_id);

    switch (update.action) {
      case FriendshipAction.Accept:
        this.logger.info(`User ${from} accepting friend request from ${update.user_id}`);
        await this.acceptRequest(fromUser, targetUser);
        await FriendNotifications.newFriend(targetUser, fromUser);
        break;
      case FriendshipAction.Block:
        this.logger.warn(`User ${from} blocking user ${update.user_id}`);
        await this.blockUser(fromUser, targetUser);
        break;
      case FriendshipAction.Request:
        this.logger.info(`User ${from} sending friend request to ${update.user_id}`);
        await FriendNotifications.newFriendRequest(targetUser, fromUser);
        await this.requestFriendship(fromUser, targetUser);
        break;
      case FriendshipAction.Cancel:
      case FriendshipAction.Remove:
      case FriendshipAction.Decline:
        this.logger.info(`User ${from} removing friend request from ${update.user_id}`);
        await this.deleteFriendship(fromUser, targetUser);
        break;
      default:
        throw new LyfError(`Invalid friendship update - action was ${update.action}`, 400);
    }

    // Return users' new social field
    await fromUser.fetchRelations('include=users');
    const exportedUser = await fromUser.export() as ExposedUser;
    return exportedUser.relations.users;
  }

  private async createFriendship(friendship: UserFriendRelation, status: UserFriendshipStatus) {
    const [id1, id2] = friendship.sortedIds();

    const newFriendship: UserFriendshipDbObject = {
      user1_id_fk: id1,
      user2_id_fk: id2,
      created: new Date(),
      last_updated: new Date(),
      status: status
    };

    try {
      await friendship.create(newFriendship, UserFriendRelation.filter);
    } catch (e) {
      await friendship.load();
      if (friendship.blocked()) {
        throw new LyfError(`Relationship is blocked, user ${friendship.entityId()} should not have appeared for ${friendship.id()}`, 500);
      }

      throw new LyfError(`Some relationship between ${id1} and ${id2} already exists!`, 400);
    }

  }

  private async blockUser(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
    const [id1, _id2] = friendship.sortedIds();

    const desiredStatus = from.id() === id1
      ? UserFriendshipStatus.BlockedByFirst
      : UserFriendshipStatus.BlockedBySecond;

    try {
      await friendship.load();
      const status = (await friendship.extract()).status;

      const requiredForMutualBlock = from.id() === id1
        ? UserFriendshipStatus.BlockedBySecond
        : UserFriendshipStatus.BlockedByFirst;

      const shouldMutualBlock = status === requiredForMutualBlock;

      if (shouldMutualBlock) {
        await friendship.update({ status: UserFriendshipStatus.MutualBlock });
      } else {
        await friendship.update({ status: desiredStatus });
      }

    } catch (e) {
      this.logger.warn('Block status requested on non-existent friendship, creating now');
      await this.createFriendship(friendship, desiredStatus);
    }
  }

  private async requestFriendship(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
    const [id1, id2] = friendship.sortedIds();

    const creationStatus = from.id() === id1
      ? UserFriendshipStatus.PendingSecondAcceptance
      : UserFriendshipStatus.PendingFirstAcceptance;

    await this.createFriendship(friendship, creationStatus);
  }

  private async acceptRequest(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
    if (friendship.blocked()) {
      throw new LyfError(`Got accept request on blocked relationship ${from.id()} + ${target.id()}`, 400);
    }

    await friendship.load();

    // Want to confirm the request is in a fertile state to be accepted
    if (friendship.pendingOnFrom()) {
      await friendship.update({ status: UserFriendshipStatus.Friends });
      await friendship.save();
    }
  }

  private async deleteFriendship(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
    await friendship.delete();
  }
}
