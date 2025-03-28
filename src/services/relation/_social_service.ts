import { ID } from '../../../schema/database/abstract';
import { ItemDbObject } from '../../../schema/database/items';
import { Permission } from '../../../schema/database/items_on_users';
import { NoteDbObject } from '../../../schema/database/notes';
import { SocialAction } from '../../../schema/util/social';
import { SocialEntity, SocialRelation } from '../../models/entity/_social_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { LyfError } from '../../utils/lyf_error';
import { BaseService } from '../_base_service';

type AnySocialObject = ItemDbObject|NoteDbObject;

export type SocialUpdate = {
  entity_id: ID;
  user_id: ID;
  action: SocialAction;
  permission: Permission
};

export abstract class SocialService<T extends SocialRelation> extends BaseService {
  protected abstract createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean): Promise<T>;
  protected abstract getRelation(entity: SocialEntity<AnySocialObject>, user: UserEntity): Promise<T>;
  protected abstract updateIsCollaborative(entity_id: ID): Promise<void>;
  public abstract processUpdate(from: ID, update: SocialUpdate): Promise<T | null>;

  public async inviteUser(
    invited_user: ID,
    inviter_relation: T,
    permission: Permission
  ): Promise<T> {
    // User must be the owner or editor to do this! (currently)
    if (
      !inviter_relation ||
      inviter_relation.invited() ||
      inviter_relation.permission() === Permission.ReadOnly
    ) {
      throw new LyfError('You must be an Editor or Owner of this task/event to add other users', 403);
    }

    await inviter_relation.getRelatedEntity().fetchRelations('users');

    const inviterFriends = inviter_relation.getRelatedEntity().getRelations().users;
    const userFriendship = inviterFriends?.find((x) => x.entityId() === invited_user);

    if (!userFriendship?.friends()) {
      throw new LyfError('You can only invite friends to your items!', 403);
    }

    // Add the user to the invite list
    try {
      const newRelation = await this.createDefaultRelation(inviter_relation.id(), invited_user, permission, true);
      await newRelation.getRelatedEntity().load()
      return newRelation;
    } catch (error) {
      throw new LyfError(`${invited_user} is already a member of this item`, 400)
    }
  }

  public async acceptInvite(item_relation: T) {
    if (!item_relation.invited()) {
      throw new LyfError(`There is no invite pending for user ${item_relation.entityId()} on entity ${item_relation.id()}`, 500);
    }

    await item_relation.update({ invite_pending: false });
    await item_relation.save();
    return item_relation;
  }

  public async removeUser(removed_relation: T, remover_relation: T) {
    if (remover_relation.entityId() !== removed_relation.entityId() && remover_relation.permission() !== Permission.Owner) {
      throw new LyfError('You must be the Owner to remove another user!', 403);
    }

    await removed_relation.delete();
    return null;
  }
}
