import { ID } from '../../api/schema/database/abstract';
import { ItemDbObject } from '../../api/schema/database/items';
import { Permission } from '../../api/schema/database/items_on_users';
import { NoteDbObject } from '../../api/schema/database/notes';
import { ItemRelatedUser } from '../../api/schema/items';
import { SocialAction } from '../../api/schema/util/social';
import { SocialEntity, SocialRelation } from '../../models/entity/_social_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { ItemUserRelation } from '../../models/relation/item_related_user';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { UserFriendRelation } from '../../models/relation/user_friend';
import { LyfError } from '../../utils/lyf_error';
import { BaseService } from '../_base_service';

type AnySocialObject = ItemDbObject|NoteDbObject;


export type SocialUpdate = {
  entity_id: ID;
  user_id: ID;
  action: SocialAction;
  permission: Permission
};

export abstract class SocialService extends BaseService {
  protected abstract createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean): Promise<SocialRelation>;
  protected abstract getRelation(entity: SocialEntity<AnySocialObject>, user: UserEntity): Promise<SocialRelation>;
  protected abstract updateIsCollaborative(entity_id: ID): Promise<void>;
  public abstract processUpdate(from: ID, update: SocialUpdate): Promise<SocialRelation | null>;

  public async inviteUser(invited_user: ID, inviter_relation: SocialRelation, permission: Permission) {
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

  public async acceptInvite(item_relation: SocialRelation) {
    if (!item_relation.invited()) {
      throw new LyfError(`There is no invite pending for user ${item_relation.entityId()} on entity ${item_relation.id()}`, 500);
    }

    await item_relation.update({ invite_pending: false });
    await item_relation.save();
    return item_relation;
  }

  public async removeUser(removed_user: ID, remover_relation: SocialRelation) {
    if (remover_relation.entityId() !== removed_user && remover_relation.permission() !== Permission.Owner) {
      throw new LyfError('You must be the Owner to remove another user!', 403);
    }
  
    const deletedRelation = new ItemUserRelation(remover_relation.id(), removed_user);
    await deletedRelation.delete();
    return null;
  }
}
