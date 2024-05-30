import { ID } from '../../api/schema/database/abstract';
import { ItemDbObject } from '../../api/schema/database/items';
import { Permission } from '../../api/schema/database/items_on_users';
import { NoteDbObject } from '../../api/schema/database/notes';
import { SocialEntity, SocialRelation } from '../../models/entity/_social_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { UserFriendRelation } from '../../models/relation/user_friend';
import { LyfError } from '../../utils/lyf_error';
import { BaseService } from '../_base_service';

type AnySocialObject = ItemDbObject|NoteDbObject;

export enum SocialAction {
  Invite = 'Invite',
  Cancel = 'Cancel',
  Accept = 'Accept',
  Decline = 'Decline',
  Remove = 'Remove'
}

export type SocialUpdate = {
  entity_id: ID;
  user_id: ID;
  action: SocialAction;
  permission?: Permission
};

export abstract class SocialService extends BaseService {
  protected abstract createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean): Promise<SocialRelation>;
  protected abstract getRelation(entity: SocialEntity<AnySocialObject>, user: UserEntity): Promise<SocialRelation>;
  public abstract processUpdate(from: ID, update: SocialUpdate): Promise<SocialEntity<AnySocialObject>>;

  public async inviteUser(entity: SocialEntity<AnySocialObject>, invited_user: UserEntity, invited_by: UserEntity, permission: Permission) {
    await entity.getUsers();
    const relatedUsers = entity.getRelations().users as SocialRelation[];

    const inviterRelation = relatedUsers.find((x) => x.entityId() === invited_by.id());
    const inviter = inviterRelation?.getRelatedEntity();

    // User must be the owner or editor to do this! (currently)
    if (
      !inviter ||
      !inviterRelation ||
      inviterRelation.invited() ||
      inviterRelation.permission() !== Permission.Owner
    ) {
      throw new Error('You must be the creator of this task/event to add other users');
    }

    await inviter.fetchRelations('users');
    await inviter.load();

    const inviterFriends = inviter.getRelations().users as UserFriendRelation[];
    const userFriendship = inviterFriends.find((x) => x.entityId() === invited_user.id());

    if (!userFriendship?.friends()) {
      throw new Error('You can only invite friends to your items!');
    }

    // Add the user to the invite list
    await this.createDefaultRelation(entity.id(), invited_user.id(), permission, true);
  }

  public async acceptInvite(entity: SocialEntity<AnySocialObject>, user: UserEntity) {
    const relation = await this.getRelation(entity, user);

    if (!relation.invited()) {
      throw new LyfError(`There is no invite pending for user ${user.id()} on entity ${entity.id()}`, 500);
    }

    await relation.update({ invite_pending: false });
  }

  public async removeUser(entity: SocialEntity<AnySocialObject>, user: UserEntity, from: UserEntity) {
    const requestor = await this.getRelation(entity, from);
    if (user.id() !== from.id() && requestor.permission() !== Permission.Owner) {
      throw new LyfError('You must be the Owner to remove another user!', 403);
    }

    const relation = await this.getRelation(entity, user);
    await relation.delete();
  }
}
