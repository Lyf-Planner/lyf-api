import { ID } from '../../api/mongo_schema/abstract';
import { ItemUserRelationshipDbObject, Permission } from '../../api/schema/database/items_on_users';
import { ItemEntity } from '../../models/v3/entity/item_entity';
import { UserEntity } from '../../models/v3/entity/user_entity';
import { ItemUserRelation } from '../../models/v3/relation/item_related_user';
import { Logger } from '../../utils/logging';
import { ItemService } from '../entity/item_service';
import { UserService } from '../entity/user_service';
import { SocialItemNotifications } from '../notifications/item_notifications';
import { SocialAction, SocialService, SocialUpdate } from './_social_service';

export class SocialItemService extends SocialService {
  protected logger = Logger.of(SocialItemService);

  protected async createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean) {
    const relation = new ItemUserRelation(id, user_id);

    const dbObject: ItemUserRelationshipDbObject = {
      created: new Date(),
      last_updated: new Date(),
      item_id_fk: id,
      user_id_fk: user_id,
      invite_pending: invited,
      permission,
      sorting_rank: 0
    };

    await relation.create(dbObject);
    return relation;
  }

  protected async getRelation(entity: ItemEntity, user: UserEntity) {
    const relation = new ItemUserRelation(entity.id(), user.id());
    await relation.load();
    return relation;
  }

  async processUpdate(from: ID, update: SocialUpdate) {
    const itemService = new ItemService();
    const userService = new UserService();

    const item = await itemService.getEntity(update.entity_id);
    const fromUser = await userService.getEntity(from);
    const targetUser = await userService.getEntity(update.user_id);

    switch (update.action) {
      case SocialAction.Invite:
        this.logger.info(`User ${update.user_id} invited to item ${update.entity_id} by ${from}`);
        await this.inviteUser(item, targetUser, fromUser, update.permission!);
        await SocialItemNotifications.newItemInvite(targetUser, fromUser, item);
        break;
      case SocialAction.Accept:
        this.logger.info(`User ${from} accepted invitation to item ${update.entity_id}`);
        await this.acceptInvite(item, targetUser);
        await SocialItemNotifications.newItemUser(fromUser, item);
        break;
      case SocialAction.Decline:
        this.logger.info(`User ${from} declined invitation to item ${update.entity_id}`);
        await this.removeUser(item, targetUser, targetUser);
        break;
      case SocialAction.Cancel:
      case SocialAction.Remove:
        this.logger.info(
          `User ${from} removing user ${update.user_id} from item ${update.entity_id}`
        );
        await this.removeUser(item, targetUser, fromUser);
        break;
    }

    await item.fetchRelations();
    await item.load();
    return item;
  }
}
