import { ID } from '../../types/mongo_schema/abstract';
import { Permission } from '../../types/schema/database/items_on_users';
import { NoteUserRelationshipDbObject } from '../../types/schema/database/notes_on_users';
import { SocialAction } from '../../types/schema/util/social';
import { NoteEntity } from '../../models/entity/note_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { SocialService, SocialUpdate } from './_social_service';

export class SocialNoteService extends SocialService<NoteUserRelation> {
  protected logger = Logger.of(SocialNoteService);

  protected async createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean) {
    const relation = new NoteUserRelation(id, user_id);

    const dbObject: NoteUserRelationshipDbObject = {
      created: new Date(),
      last_updated: new Date(),
      note_id_fk: id,
      user_id_fk: user_id,
      invite_pending: invited,
      permission
    };

    await relation.create(dbObject, NoteUserRelation.filter);
    return relation;
  }

  protected async getRelation(entity: NoteEntity, user: UserEntity) {
    const relation = new NoteUserRelation(entity.id(), user.id());
    await relation.load();
    return relation;
  }

  async processUpdate(from: ID, update: SocialUpdate) {
    const fromUser = new NoteUserRelation(update.entity_id, from);
    await fromUser.load()

    let modifiedRelation;

    switch (update.action) {
      case SocialAction.Invite:
        this.logger.info(`User ${update.user_id} invited to note ${update.entity_id} by ${from}`);
        modifiedRelation = await this.inviteUser(update.user_id, fromUser, update.permission!);
        // SocialItemNotifications.newItemInvite(targetUser, fromUser, item);
        break;
      case SocialAction.Accept:
        this.logger.info(`User ${from} accepted invitation to note ${update.entity_id}`);
        modifiedRelation = await this.acceptInvite(fromUser);
        // SocialItemNotifications.newItemUser(fromUser, item);
        break;
      case SocialAction.Decline:
        this.logger.info(`User ${from} declined invitation to note ${update.entity_id}`);
        modifiedRelation = await this.removeUser(update.user_id, fromUser);
        break;
      case SocialAction.Cancel:
      case SocialAction.Remove:
        this.logger.info(
          `User ${from} removing user ${update.user_id} from note ${update.entity_id}`
        );
        modifiedRelation = await this.removeUser(update.user_id, fromUser);
        break;
      default:
        throw new LyfError(`Invalid social note update - action was ${update.action}`, 400);
    }

    this.updateIsCollaborative(update.entity_id)

    return modifiedRelation;
  }

  protected async updateIsCollaborative(note_id: ID) {
    try {
      const item = new NoteEntity(note_id);
      await item.fetchRelations("users");

      const numUsers = item.getRelations().users?.length
      const collaborative = !!numUsers && numUsers > 1
      await item.directlyModify({ collaborative })
    } catch (error) {
      this.logger.error(`Failed to update collaborative flag on item ${note_id}`)
    }
  }
}
