import { ID } from "../../api/abstract";
import { ListItem } from "../../api/list";
import { Permission } from "../../api/social";
import { ItemModel } from "../items/itemModel";
import { SocialUser } from "./socialUser";

export class SocialItem extends ItemModel {
  constructor(item: ListItem, from_db: boolean = false, requested_by: string) {
    super(item, from_db, requested_by);
  }

  public async approveSocialChanges() {
    await this.commit();
  }

  public inviteUser(invitee: SocialUser, invited_by: SocialUser) {
    const inviter = this.content.permitted_users.find(
      (x) => x.user_id === invited_by.getContent().id
    );

    // User must be the owner to do this! (currently)
    if (!inviter || inviter?.permissions !== Permission.Owner) {
      throw new Error(
        "You must be the creator of this task/event to add other users"
      );
    }

    let inviterFriendship = invited_by
      .getContent()
      .social.friends?.find((x) => x === invitee.getContent().id);
    if (!inviterFriendship) {
      throw new Error("You can only invite friends to your items!");
    }

    // Add the user to the invite list
    const newUserAccess = {
      user_id: invitee.getContent().id,
      permissions: Permission.Invitee,
    };
    this.content.invited_users
      ? this.content.invited_users.push(newUserAccess)
      : (this.content.invited_users = [newUserAccess]);
  }

  public handleInviteAddressed(user: SocialUser, accepted: boolean) {
    const user_id = user.getContent().id;

    const invite =
      this.content.invited_users &&
      this.content.invited_users.find((x) => (x.user_id = user_id));

    // Ensure user is invited
    if (!invite) {
      throw new Error("You have not been invited to this item");
    }

    if (accepted) {
      // Add user to permitted_users list
      if (invite.permissions === Permission.Invitee) {
        invite.permissions = Permission.Editor;
      }
      this.content.permitted_users.push(invite);
    }

    // Remove user from invite list
    const i = this.content.invited_users?.findIndex((x) => x === invite)!;
    this.content.invited_users?.splice(i, 1);
  }

  public removeUser(user: SocialUser) {
    const user_id = user.getContent().id;

    // Requested_by must match user or have owner permission
    let requestor_perm = this.getUserPermission(this.requested_by);
    if (requestor_perm !== Permission.Owner && this.requested_by !== user_id) {
      throw new Error("You must be the Owner to kick another user!");
    }

    const i = this.content.permitted_users.findIndex(
      (x) => x.user_id === user_id
    );
    this.content.permitted_users.splice(i, 1);
  }

  public removeInvite(user: SocialUser) {
    let requestor_perm = this.getUserPermission(this.requested_by);
    if (requestor_perm !== Permission.Owner) {
      throw new Error("You must be the Owner to cancel an invite!");
    }

    const user_id = user.getContent().id;
    if (!this.content.invited_users) return;
    const i = this.content.invited_users.findIndex(
      (x) => x.user_id === user_id
    );
    this.content.invited_users.splice(i, 1);
  }
}
