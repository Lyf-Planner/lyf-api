import { ID } from '../../../api/mongo_schema/abstract';
import { FriendshipAction, FriendshipUpdate } from '../../../api/mongo_schema/social';
import { Logger } from '../../../utils/logging';
import { FriendNotifications } from '../notifications/friendNotificationService';
import { UserOperations } from '../users/userOperations';
import { SocialUser } from './socialUser';

export class FriendshipManager {
  public logger = Logger.of(FriendshipManager);
  private from: SocialUser;
  private target: SocialUser;

  static async processUpdate(from: ID, update: FriendshipUpdate) {
    // Can't address yourself
    if (from === update.user_id) {
      throw new Error('You cannot friend yourself');
    }

    const fromUser = (await UserOperations.retrieveForUser(from, from, true)) as SocialUser;
    const targetUser = (await UserOperations.retrieveForUser(
      update.user_id,
      from,
      true
    )) as SocialUser;

    const controller = new FriendshipManager(fromUser, targetUser);

    switch (update.action) {
      case FriendshipAction.Request:
        controller.logger.info(`User ${from} sending friend request to ${update.user_id}`);
        await FriendNotifications.newFriendRequest(targetUser, fromUser);
        await controller.requestFriendship();
        break;
      case FriendshipAction.Cancel:
        controller.logger.info(`User ${from} cancelling friend request to ${update.user_id}`);
        await controller.cancelFriendRequest();
        break;
      case FriendshipAction.Accept:
        controller.logger.info(`User ${from} accepting friend request from ${update.user_id}`);
        await controller.addressIncomingRequest(true);
        await FriendNotifications.newFriend(targetUser, fromUser);
        break;
      case FriendshipAction.Decline:
        controller.logger.info(`User ${from} declining friend request from ${update.user_id}`);
        await controller.addressIncomingRequest(false);
        break;
      case FriendshipAction.Remove:
        controller.logger.info(`User ${from} deleting friendship with ${update.user_id}`);
        await controller.deleteFriendship();
        break;
    }

    // Return users' new social field
    return fromUser.getContent().social;
  }

  constructor(from: SocialUser, target: SocialUser) {
    this.from = from;
    this.target = target;
  }

  public async cancelFriendRequest() {
    // Update on from
    this.from.cancelRequest(this.target.getId());

    // Update on target
    this.target.cancelRequest(this.from.getId());

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async requestFriendship() {
    // Add to from
    this.from.noteRequestToSelf(this.target.getId());

    // Add to target
    this.target.receiveFriendRequest(this.from.getId());

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async addressIncomingRequest(accepted: boolean) {
    // Note the potential confusion here -
    // The from user is the one who calls the endpoint and is addressing the request, not the one who sent the friend request

    // Update on from
    this.from.addressIncomingFriendRequest(this.target.getId(), accepted);

    // Update on target
    this.target.updateOutgoingFriendRequest(this.from.getId(), accepted);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async deleteFriendship() {
    // Update on from
    this.from.deleteFriendship(this.target.getId());

    // Update on target
    this.target.deleteFriendship(this.from.getId());

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async commitToBoth() {
    await this.from.approveSocialChanges();
    await this.target.approveSocialChanges();
  }
}
