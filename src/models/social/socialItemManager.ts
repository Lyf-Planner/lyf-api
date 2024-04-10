import { ID } from '../../api/mongo_schema/abstract';
import { SocialAction } from '../../api/mongo_schema/social';
import { updateItemSocialBody } from '../../controller/validators/itemValidators';
import { Logger } from '../../utils/logging';
import { ItemOperations } from '../items/ItemOperations';
import { UserOperations } from '../users/userOperations';
import { SocialItem } from './socialItem';
import { SocialItemNotifications } from '../notifications/socialItemNotificationService';
import { SocialUser } from './socialUser';

export class SocialItemManager {
  private from: SocialUser;
  private target: SocialUser;
  private item: SocialItem;
  public logger = Logger.of(SocialItemManager);

  constructor(from: SocialUser, target: SocialUser, item: SocialItem) {
    this.from = from;
    this.target = target;
    this.item = item;
  }

  static async processUpdate(from: ID, update: updateItemSocialBody) {
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
    let item = (await ItemOperations.retrieveForUser(
      update.item_id,
      from,
      true,
      true
    )) as SocialItem;

    let controller = new SocialItemManager(fromUser, targetUser, item);

    switch (update.action) {
      case SocialAction.Invite:
        controller.logger.info(
          `User ${from} invited user ${update.user_id} to item ${update.item_id}`
        );
        await controller.inviteUser();
        await SocialItemNotifications.newItemInvite(targetUser, fromUser, item);
        break;
      case SocialAction.Accept:
        controller.logger.info(
          `User ${from} accepted invitation to item ${update.item_id}`
        );
        await controller.addressItemInvite(true);
        await SocialItemNotifications.newItemUser(fromUser, item);
        break;
      case SocialAction.Decline:
        controller.logger.info(
          `User ${from} declined invitation to item ${update.item_id}`
        );
        await controller.addressItemInvite(false);
        break;
      case SocialAction.Cancel:
        controller.logger.info(
          `User ${from} cancelling invitation for ${update.user_id} to item ${update.item_id}`
        );
        await controller.cancelItemInvite();
        break;
      case SocialAction.Remove:
        controller.logger.info(
          `User ${from} removing user ${update.user_id} from item ${update.item_id}`
        );
        await controller.removeUserFromItem();
        break;
    }

    Logger.of(SocialItemManager).debug('Item Social is::');
    Logger.of(SocialItemManager).debug(
      `Permitted Users: ${item.getContent().permitted_users}`
    );
    Logger.of(SocialItemManager).debug(
      `Invited Users: ${item.getContent().invited_users}`
    );

    // Return users' new social field
    return {
      permitted_users: item.getContent().permitted_users,
      invited_users: item.getContent().invited_users
    };
  }

  private async inviteUser() {
    // Update item data
    this.item.inviteUser(this.target, this.from);

    // Update user data
    this.target.receiveItemInvite(this.item, this.from);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async addressItemInvite(accepted: boolean) {
    // Update item data
    this.item.handleInviteAddressed(this.target, accepted);

    // Update user data
    this.target.addressItemInvite(this.item, accepted);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  public async removeUserFromItem() {
    // Update item data
    this.item.removeUser(this.target);

    // Update user data
    this.target.leaveItem(this.item);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  public async cancelItemInvite() {
    // Update item data
    this.item.removeInvite(this.target);

    // Update user data
    this.target.removeInvite(this.item);

    // No errors were triggered, commit changes to both
    await this.commitToBoth();
  }

  private async commitToBoth() {
    await this.target.approveSocialChanges();
    await this.item.approveSocialChanges();
  }
}
