import { ItemUserRelationshipDbObject, Permission } from '../../../schema/database/items_on_users';
import { ID } from '../../../schema/mongo_schema/abstract';
import { SocialAction } from '../../../schema/util/social';
import { ItemEntity } from '../../models/entity/item_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { ItemUserRelation } from '../../models/relation/item_related_user';
import { SocialItemNotifications } from '../../modules/notification_scheduling/item_notifications';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';

import { SocialService, SocialUpdate } from './_social_service';

export class SocialItemService extends SocialService<ItemUserRelation> {
  protected logger = Logger.of(SocialItemService.name);

  protected async createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean) {
    const relation = new ItemUserRelation(id, user_id);

    const dbObject: ItemUserRelationshipDbObject = {
      created: new Date(),
      last_updated: new Date(),
      item_id_fk: id,
      user_id_fk: user_id,
      invite_pending: invited,
      permission,
      sorting_rank: 0,
      show_in_upcoming: undefined,
      notification_mins: undefined
    };

    await relation.create(dbObject, ItemUserRelation.filter);
    return relation;
  }

  protected async getRelation(entity: ItemEntity, user: UserEntity) {
    const relation = new ItemUserRelation(entity.id(), user.id());
    await relation.load();
    return relation;
  }

  async processUpdate(from: ID, update: SocialUpdate) {
    const fromUser = new ItemUserRelation(update.entity_id, from);
    await fromUser.load()

    let modifiedRelation;

    switch (update.action) {
      case SocialAction.Invite:
        this.logger.info(`User ${update.user_id} invited to item ${update.entity_id} by ${from}`);
        modifiedRelation = await this.inviteUser(update.user_id, fromUser, update.permission!);
        SocialItemNotifications.newItemInvite(fromUser, modifiedRelation);
        break;
      case SocialAction.Accept:
        this.logger.info(`User ${from} accepted invitation to item ${update.entity_id}`);
        modifiedRelation = await this.acceptInvite(fromUser);
        SocialItemNotifications.newItemUser(fromUser, modifiedRelation);
        break;
      case SocialAction.Decline:
        this.logger.info(`User ${from} declined invitation to item ${update.entity_id}`);
      case SocialAction.Cancel:
      case SocialAction.Remove:
        this.logger.info(
          `User ${from} removing user ${update.user_id} from item ${update.entity_id}`
        );
        const targetRelation = new ItemUserRelation(update.user_id, update.entity_id);
        modifiedRelation = await this.removeUser(targetRelation, fromUser);
        break;
      default:
        throw new LyfError(`Invalid social item update - action was ${update.action}`, 400);
    }

    this.updateIsCollaborative(update.entity_id)
    return modifiedRelation;
  }

  protected async updateIsCollaborative(item_id: ID) {
    try {
      const item = new ItemEntity(item_id);
      await item.fetchRelations('users');

      const numUsers = item.getRelations().users?.length
      const collaborative = !!numUsers && numUsers > 1
      await item.directlyModify({ collaborative })
    } catch (error) {
      this.logger.error(`Failed to update collaborative flag on item ${item_id}`, error)
    }
  }
}
