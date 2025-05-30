import { ID } from '#/database/abstract';
import { Permission } from '#/database/items_on_users';
import { NoteUserRelationshipDbObject } from '#/database/notes_on_users';
import { SocialAction } from '#/util/social';
import { NoteEntity } from '@/models/entity/note_entity';
import { UserEntity } from '@/models/entity/user_entity';
import { NoteUserRelation } from '@/models/relation/note_related_user';
import { SocialNoteNotifications } from '@/modules/notification_scheduling/note_notifications';
import { SocialService, SocialUpdate } from '@/services/relation/_social_service';
import { Logger } from '@/utils/logging';
import { LyfError } from '@/utils/lyf_error';

export class SocialNoteService extends SocialService<NoteUserRelation> {
  protected logger = Logger.of(SocialNoteService.name);

  protected async createDefaultRelation(id: ID, user_id: ID, permission: Permission, invited: boolean) {
    const relation = new NoteUserRelation(id, user_id);

    const dbObject: NoteUserRelationshipDbObject = {
      created: new Date(),
      last_updated: new Date(),
      note_id_fk: id,
      user_id_fk: user_id,
      invite_pending: invited,
      permission,
      sorting_rank_preference: -1 // trick to make this appear at the top of the users root notes
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
        SocialNoteNotifications.newNoteInvite(fromUser, modifiedRelation);
        break;
      case SocialAction.Accept:
        this.logger.info(`User ${from} accepted invitation to note ${update.entity_id}`);
        modifiedRelation = await this.acceptInvite(fromUser);
        SocialNoteNotifications.newNoteUser(fromUser, modifiedRelation);
        break;
      case SocialAction.Decline:
        this.logger.info(`User ${from} declined invitation to note ${update.entity_id}`);
      case SocialAction.Cancel:
      case SocialAction.Remove:
        this.logger.info(
          `User ${from} removing user ${update.user_id} from note ${update.entity_id}`
        );
        const targetRelation = new NoteUserRelation(update.entity_id, update.user_id);
        // we have to load this one, unlike in the social_item_service
        // this is because note relations can be inherited, and deletion relies on loading data in to delete an inherited relation.
        await targetRelation.load();

        if (!targetRelation.hasBase()) {
          this.logger.warn(`user does not have relation with note ${update.entity_id}, returning early`);
          return null;
        }

        modifiedRelation = await this.removeUser(targetRelation, fromUser);
        break;
      default:
        throw new LyfError(`Invalid social note update - action was ${update.action}`, 400);
    }

    this.updateIsCollaborative(update.entity_id)

    return modifiedRelation;
  }

  protected async updateIsCollaborative(note_id: ID) {
    try {
      const note = new NoteEntity(note_id);
      await note.fetchRelations('users');

      const numUsers = note.getRelations().users?.length;
      const collaborative = !!numUsers && numUsers > 1
      await note.directlyModify({ collaborative })
    } catch (error) {
      this.logger.error(`Failed to update collaborative flag on note ${note_id}`, error)
    }
  }
}
