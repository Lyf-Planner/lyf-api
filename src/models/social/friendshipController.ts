import { ID } from "../../api/abstract";
import { FriendshipAction, FriendshipUpdate } from "../../api/social";
import { UserOperations } from "../users/userOperations";
import { SocialUser } from "./socialUser";

export class FriendshipController {
  private from: SocialUser;
  private target: SocialUser;

  constructor(from: SocialUser, target: SocialUser) {
    this.from = from;
    this.target = target;
  }

  static async processUpdate(from: ID, update: FriendshipUpdate) {
    // Can't address yourself
    if (from === update.user_id) throw new Error("You cannot friend yourself");

    let fromUser = (await UserOperations.retrieveForUser(
      from,
      from,
      true
    )) as SocialUser;
    let targetUser = (await UserOperations.retrieveForUser(
      update.user_id,
      from,
      true
    )) as SocialUser;

    let controller = new FriendshipController(fromUser, targetUser);

    switch (update.action) {
      case FriendshipAction.Request:
        await controller.requestFriendship();
        break;
      case FriendshipAction.Cancel:
        await controller.cancelFriendRequest();
        break;
      case FriendshipAction.Accept:
      case FriendshipAction.Deny:
        await controller.addressIncomingRequest(
          update.action === FriendshipAction.Accept
        );
        break;
      case FriendshipAction.Remove:
        await controller.deleteFriendship();
        break;
    }

    // Return users' new social field
    return fromUser.getContent().social;
  }

  private async requestFriendship() {
    // Add to from
    this.from.noteRequestToSelf(this.target.getContent().id);

    // Add to target
    this.target.receiveFriendRequest(this.from.getContent().id);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async addressIncomingRequest(accepted: boolean) {
    // Note the potential confusion here -
    // The from user is the one who calls the endpoint and is addressing the request, not the one who sent the friend request

    // Update on from
    this.from.addressIncomingFriendRequest(
      this.target.getContent().id,
      accepted
    );

    // Update on target
    this.target.updateOutgoingFriendRequest(
      this.from.getContent().id,
      accepted
    );

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async deleteFriendship() {
    // Update on from
    this.from.deleteFriendship(this.target.getContent().id);

    // Update on target
    this.target.deleteFriendship(this.from.getContent().id);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  public async cancelFriendRequest() {
    // Update on from
    this.from.cancelRequest(this.target.getContent().id);

    // Update on target
    this.target.cancelRequest(this.from.getContent().id);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async commitToBoth() {
    await this.from.approveSocialChanges();
    await this.target.approveSocialChanges();
  }
}
