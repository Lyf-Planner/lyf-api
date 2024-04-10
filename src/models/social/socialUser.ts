import { ID } from '../../api/mongo_schema/abstract';
import { ListItem } from '../../api/mongo_schema/list';
import { User } from '../../api/mongo_schema/user';
import { UserModel } from '../users/userModel';
import { SocialItem } from './socialItem';

export class SocialUser extends UserModel {
  constructor(user: User, from_db: boolean, requestedBySelf: boolean) {
    super(user, from_db, requestedBySelf);
  }

  public async approveSocialChanges() {
    // We use this so we only make db changes after going through the checks on both users
    await this.commit();
  }

  // Sending Friend Requests:

  public receiveFriendRequest(from: ID) {
    var requests = this.content.social.requests || [];
    var friends = this.content.social.friends || [];

    // Ensure the user has not already requested
    if (this.userAlreadyPresent(requests, from)) return;

    // Ensure the user is not already a friend
    if (this.userAlreadyPresent(friends, from)) return;

    // Ensure the user is not blocked
    if (this.isBlocked(from)) return;

    // Add "from" user to this users requests
    requests.push(from);
    this.content.social.requests = requests;
  }

  public noteRequestToSelf(to: ID) {
    this.enforceRequestedBySelf(
      'You can only modify your own friend requests!',
      `User ${this.id} nearly had their friend requests modified by another user`
    );

    let requested = this.content.social.requested || [];
    let friends = this.content.social.friends || [];

    // Ensure the user has not already requested
    if (this.userAlreadyPresent(requested, to)) return;

    // Ensure the user is not already a friend
    if (this.userAlreadyPresent(friends, to)) return;

    // Ensure the user is not blocked
    if (this.isBlocked(to)) return;

    requested.push(to);
    this.content.social.requested = requested;
  }

  // Addressing Friend Requests:

  public async addressIncomingFriendRequest(from: ID, accepted: boolean) {
    // Can only be modified by self
    this.enforceRequestedBySelf(
      'You can only modify your own friend requests!',
      `User ${this.id} nearly had their friend requests modified by another user`
    );

    // Ensure they have 'requests' field
    var requests = this.content.social.requests || [];
    if (!requests) {
      let message = `User ${this.id} has no friend requests to accept/deny`;
      this.logger.warn(message);
      throw new Error(message);
    }

    // Ensure they have request from addressed user
    var fromRequestIndex = requests.findIndex((x) => x === from);
    if (fromRequestIndex === -1) {
      let message = `Could not find friend request from ${from} on user ${this.id}`;
      this.logger.warn(message);
      throw new Error(message);
    }

    // Handle the from user's request
    if (accepted) {
      // Add the friend
      let friends = this.content.social.friends || [];
      friends.push(from);
      this.content.social.friends = friends;
    }

    // Delete the request
    this.removeIncomingAndOutgoingRequests(from);
  }

  public updateOutgoingFriendRequest(to: ID, accepted: boolean) {
    // Ensure they have 'requested' field
    var requested = this.content.social.requested || [];
    if (!requested) {
      let message = `User ${this.id} has no friend requests to accept/deny`;
      this.logger.warn(message);
      throw new Error(message);
    }

    // Ensure they have request from addressed user
    var fromRequestIndex = requested.findIndex((x) => x === to);
    if (fromRequestIndex === -1) {
      let message = `Could not find friend request to ${to} on user ${this.id}`;
      this.logger.warn(message);
      throw new Error(message);
    }

    // Handle the from user's request
    if (accepted) {
      // Add the friend
      let friends = this.content.social.friends || [];
      friends.push(to);
      this.content.social.friends = friends;
    }

    // Delete the request
    this.removeIncomingAndOutgoingRequests(to);
  }

  // Removing Friendships:

  public deleteFriendship(toRemove: ID) {
    let friends = this.content.social.friends;

    // Ensure the user is a friend
    if (this.userAlreadyPresent(friends, toRemove)) {
      let targetIndex = friends!.findIndex((x) => x === toRemove);
      friends!.splice(targetIndex, 1);
    }
  }

  // Canceling a friendship request:

  public cancelRequest(toRemove: ID) {
    this.removeIncomingAndOutgoingRequests(toRemove);
  }

  // Item Social:

  public async receiveItemInvite(item: SocialItem, invited_by: SocialUser) {
    const item_id = item.getId();
    const invited_by_id = invited_by.getId();

    // Must be invited by a friend
    let inviter = this.content.social.friends?.find((x) => x === invited_by_id);
    if (!inviter)
      throw new Error('Users must be invited to an item by a friend');

    var invited_items = this.content.timetable.invited_items;
    // Ensure user does not get multiple invites
    if (invited_items && invited_items.includes(item_id)) return;

    this.content.timetable.invited_items
      ? this.content.timetable.invited_items.push(item_id)
      : (this.content.timetable.invited_items = [item_id]);
  }

  public addressItemInvite(item: SocialItem, accepted: boolean) {
    this.enforceRequestedBySelf('Cannot accept someone elses item invite!');
    const item_id = item.getId();

    if (accepted) {
      // Add to items
      this.content.timetable.items.push({ id: item_id });
    }

    // Remove from invites
    const i = this.content.timetable.invited_items?.findIndex(
      (x) => x === item_id
    )!;
    this.content.timetable.invited_items?.splice(i, 1);
  }

  public leaveItem(item: SocialItem) {
    const item_id = item.getId();

    const i = this.content.timetable.items.findIndex((x) => x.id === item_id);
    this.content.timetable.items.splice(i, 1);
  }

  public removeInvite(item: SocialItem) {
    const item_id = item.getId();

    const i = this.content.timetable.items.findIndex((x) => x.id === item_id);
    this.content.timetable.items.splice(i, 1);
  }

  public async addRoutineInstantiation(item: ListItem) {
    // Check the user is still on the routine
    if (!item.template_id) return;
    const myItemIds = this.content.timetable.items.map((x) => x.id);
    const onRoutine = myItemIds.includes(item.template_id);
    if (!onRoutine) return;
    else {
      this.logger.info(
        `Adding instantiation of routine ${item.title} (${item.template_id}) to user ${this.id}`
      );
      this.content.timetable.items.push({ id: item.id });
      await this.commit();
    }
  }

  // Helpers

  private isBlocked(other_user: ID) {
    var blocked = this.content.social.blocked || [];
    if (blocked && blocked.includes(other_user)) {
      this.logger.warn(
        `User ${this.id} received friend request a blocked user ${other_user} - ignoring`
      );
      return true;
    } else {
      return false;
    }
  }

  private userAlreadyPresent(array: ID[] | undefined, from: ID) {
    if (array && array.includes(from)) {
      this.logger.warn(
        `User ${this.id} received friend request from an already friend ${from} - ignoring`
      );
      return true;
    } else {
      return false;
    }
  }

  private removeIncomingAndOutgoingRequests(other: ID) {
    let requested = this.content.social.requested || [];
    let requestedIndex = requested.findIndex((x) => x === other);
    if (requestedIndex !== -1) {
      requested.splice(requestedIndex, 1);
      this.content.social.requested = requested;
    }

    let requests = this.content.social.requests || [];
    let requestIndex = requests.findIndex((x) => x === other);
    if (requestIndex !== -1) {
      requests.splice(requestIndex, 1);
      this.content.social.requests = requests;
    }
  }
}
