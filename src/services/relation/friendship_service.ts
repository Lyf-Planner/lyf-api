import { ID } from '../../api/schema/database/abstract';
import { UserFriendshipDbObject, UserFriendshipStatus } from '../../api/schema/database/user_friendships';
import { UserEntity } from '../../models/v3/entity/user_entity';
import { UserFriendRelation } from '../../models/v3/relation/user_friend';
import { UserFriendshipRepository } from '../../repository/relation/user_friendship_repository';
import { Logger } from '../../utils/logging';
import { BaseService } from '../_base_service';
import { UserService } from '../entity/user_service';
import { FriendNotifications } from '../notifications/friend_notifications';

export enum FriendshipAction {
  Accept = 'Accept',
  Block = 'Block',
  Cancel = 'Cancel',
  Decline = 'Decline', 
  Remove = 'Remove',
  Request = 'Request',
  Unblock = 'Unblock'
}

export type FriendshipUpdate = {
  user_id: ID;
  action: FriendshipAction;
};

export class FriendshipService extends BaseService {
  public logger = Logger.of(FriendshipService);

  async processUpdate(from: ID, update: FriendshipUpdate) {
    // Can't address yourself
    if (from === update.user_id) {
      throw new Error('You cannot friend yourself');
    }

    const userService = new UserService();

    const fromUser = await userService.retrieveForUser(from, from, "");
    const targetUser = await userService.retrieveForUser(update.user_id, from, "");

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
    }

    // Return users' new social field
    await fromUser.fetchRelations("include=users")
    return fromUser;
  }

  private async createFriendship(friendship: UserFriendRelation, status: UserFriendshipStatus) {
    const [id1, id2] = friendship.sortedIds()

    const newFriendship: UserFriendshipDbObject = {
      user1_id_fk: id1,
      user2_id_fk: id2,
      created: new Date(),
      last_updated: new Date(),
      status: status
    }

    await friendship.create(newFriendship);
  }

  private async blockUser(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
    const [id1, _id2] = friendship.sortedIds()

    const desiredStatus = from.id() === id1
      ? UserFriendshipStatus.BlockedByFirst
      : UserFriendshipStatus.BlockedBySecond 

    try {
      await friendship.load();
      const status = (await friendship.extract()).status

      const requiredForMutualBlock = from.id() === id1
        ? UserFriendshipStatus.BlockedBySecond
        : UserFriendshipStatus.BlockedByFirst

      const shouldMutualBlock = status === requiredForMutualBlock;

      if (shouldMutualBlock) {
        await friendship.update({ status: UserFriendshipStatus.MutualBlock })
      } else {
        await friendship.update({ status: desiredStatus })
      }

    } catch (e) {
      this.logger.warn("Block status requested on non-existent friendship, creating now")
      await this.createFriendship(friendship, desiredStatus)
    }
  }

  private async requestFriendship(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
    const [id1, id2] = friendship.sortedIds()

    const creationStatus = from.id() === id1 
      ? UserFriendshipStatus.PendingSecondAcceptance
      : UserFriendshipStatus.PendingFirstAcceptance

    await this.createFriendship(friendship, creationStatus)
  }

  private async acceptRequest(from: UserEntity, target: UserEntity) {
    const friendship = new UserFriendRelation(from.id(), target.id());
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