import { ID } from "../../api/abstract";
import { ListItem } from "../../api/list";
import { Permission } from "../../api/social";
import { ItemModel } from "../items/itemModel";
import { UserModel } from "../users/userModel";
import { UserOperations } from "../users/userOperations";

export class SocialItem extends ItemModel {
  constructor(item: ListItem, from_db: boolean = false, requested_by: string) {
    super(item, from_db, requested_by);
  }

  public async inviteUser(invitee: UserModel, invited_by: ID) {
    const inviter = this.content.permitted_users.find(
      (x) => x.user_id === invited_by
    );

    // User must be the owner to do this! (currently)
    if (!inviter || inviter?.permissions !== Permission.Owner) {
      throw new Error(
        "You must be the creator of this task/event to add other users"
      );
    }

    // Invited user must be a friend
    let inviterData = await UserOperations.retrieveForUser(
      invited_by,
      invited_by
    );
    
    let inviterFriend = inviterData
      .getContent()
      .social.friends?.find((x) => x === invitee.getContent().id);
    if (!inviterFriend) {
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

    await this.commit();
  }

  public async joinItem(user_id: ID) {
    const invite =
      this.content.invited_users &&
      this.content.invited_users.find((x) => (x.user_id = user_id));

    // Ensure user is invited
    if (!invite) {
      throw new Error("You have not been invited to this item");
    }

    // Remove user from invite list
    const i = this.content.invited_users?.findIndex((x) => x === invite)!;
    this.content.invited_users?.splice(i, 1);

    // Add user to permitted_users list
    if (invite.permissions === Permission.Invitee) {
      invite.permissions = Permission.Editor;
    }
    this.content.permitted_users.push(invite);

    await this.commit();
  }
}
