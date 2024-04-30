import { ID } from '../../../api/mongo_schema/abstract';
import { ListItem } from '../../../api/mongo_schema/list';
import { Permission } from '../../../api/mongo_schema/social';
import { ItemModel } from '../items/itemModel';
import { SocialUser } from './socialUser';

export class SocialItem extends ItemModel {
  constructor(item: ListItem, from_db: boolean = false, requested_by: string) {
    super(item, from_db, requested_by);
  }

  public async approveSocialChanges() {
    await this.commit();
  }

  public inviteUser(invited_user: SocialUser, invited_by: SocialUser) {
    const inviter = this.content.permitted_users.find((x) => x.user_id === invited_by.getId());

    // User must be the owner to do this! (currently)
    if (!inviter || inviter?.permissions !== Permission.Owner) {
      throw new Error('You must be the creator of this task/event to add other users');
    }

    const inviterFriendship = invited_by
      .getContent()
      .social.friends?.find((x) => x === invited_user.getId());
    if (!inviterFriendship) {
      throw new Error('You can only invite friends to your items!');
    }

    // Add the user to the invite list
    const newUserAccess = {
      user_id: invited_user.getId(),
      displayed_as: invited_user.name(),
      permissions: Permission.Invited
    };
    this.content.invited_users
      ? this.content.invited_users.push(newUserAccess)
      : (this.content.invited_users = [newUserAccess]);
  }

  public handleInviteAddressed(user: SocialUser, accepted: boolean) {
    const user_id = user.getId();

    if (this.getUserPermission(user_id) !== Permission.Invited) {
      throw new Error(
        'You either accepted or no longer have an invite for this item. Please refresh!'
      );
    }

    const invite =
      this.content.invited_users && this.content.invited_users.find((x) => x.user_id === user_id);

    // Ensure user is invited
    if (!invite) {
      throw new Error('Server Error: User had Invited permission but could not find invite');
    }

    if (accepted) {
      // Add user to permitted_users list
      if (invite.permissions === Permission.Invited) {
        invite.permissions = Permission.Editor;
      }
      this.content.permitted_users.push(invite);
    }

    // Remove user from invite list
    const i = this.content.invited_users?.findIndex((x) => x.user_id === invite.user_id)!;
    this.content.invited_users?.splice(i, 1);
  }

  public removeUser(user: SocialUser) {
    const user_id = user.getId();

    // Requested_by must match user or have owner permission
    const requestor_perm = this.getUserPermission(this.requestedBy);
    if (requestor_perm !== Permission.Owner && this.requestedBy !== user_id) {
      throw new Error('You must be the Owner to kick another user!');
    }

    const i = this.content.permitted_users.findIndex((x) => x.user_id === user_id);
    this.content.permitted_users.splice(i, 1);
  }

  public removeInvite(user: SocialUser) {
    const requestor_perm = this.getUserPermission(this.requestedBy);
    if (requestor_perm !== Permission.Owner) {
      throw new Error('You must be the Owner to cancel an invite!');
    }

    const user_id = user.getId();
    if (!this.content.invited_users) {
      return;
    }
    const i = this.content.invited_users.findIndex((x) => x.user_id === user_id);
    this.content.invited_users.splice(i, 1);
  }
}
