import { ID } from '../../api/mongo_schema/abstract';
import { Permission } from '../../api/schema/database/items_on_users';
import { NoteUserRelationshipDbObject } from '../../api/schema/database/notes_on_users';
import { SocialAction } from '../../api/schema/util/social';
import { NoteEntity } from '../../models/entity/note_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { NoteService } from '../entity/note_service';
import { UserService } from '../entity/user_service';
import { SocialService, SocialUpdate } from './_social_service';

export class SocialNoteService extends SocialService {
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

    await relation.create(dbObject);
    return relation;
  }

  protected async getRelation(entity: NoteEntity, user: UserEntity) {
    const relation = new NoteUserRelation(entity.id(), user.id());
    await relation.load();
    return relation;
  }

  async processUpdate(from: ID, update: SocialUpdate) {
    const noteService = new NoteService();
    const userService = new UserService();

    const note = await noteService.getEntity(update.entity_id);
    const fromUser = await userService.getEntity(from);
    const targetUser = await userService.getEntity(update.user_id);

    switch (update.action) {
      case SocialAction.Invite:
        this.logger.info(`User ${update.user_id} invited to item ${update.entity_id} by ${from}`);
        await this.inviteUser(note, targetUser, fromUser, update.permission!);
        // await SocialItemNotifications.newItemInvite(targetUser, fromUser, note);
        break;
      case SocialAction.Accept:
        this.logger.info(`User ${from} accepted invitation to item ${update.entity_id}`);
        await this.acceptInvite(note, targetUser);
        // await SocialItemNotifications.newItemUser(fromUser, note);
        break;
      case SocialAction.Decline:
        this.logger.info(`User ${from} declined invitation to item ${update.entity_id}`);
        // await this.removeUser(item, targetUser, targetUser);
        break;
      case SocialAction.Cancel:
      case SocialAction.Remove:
        this.logger.info(
          `User ${from} removing user ${update.user_id} from item ${update.entity_id}`
        );
        // await this.removeUser(item, targetUser, fromUser);
        break;
      default:
        throw new LyfError(`Invalid social note update - action was ${update.action}`, 400);
    }

    await note.fetchRelations();
    await note.load();
    return note;
  }
}
