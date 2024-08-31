import { ID } from '../../types/schema/database/abstract';
import { Permission } from '../../types/schema/database/items_on_users';
import { NoteDbObject } from '../../types/schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../types/schema/database/notes_on_users';
import { UserRelatedNote } from '../../types/schema/user';
import { NoteEntity } from '../../models/entity/note_entity';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { EntityService } from './_entity_service';
import { UserService } from './user_service';

export class NoteService extends EntityService<NoteDbObject> {
  protected logger = Logger.of(NoteService);

  async getEntity(note_id: ID, include?: string) {
    const note = new NoteEntity(note_id);
    await note.fetchRelations(include);
    await note.load();

    return note;
  }

  async processCreation(note_input: NoteDbObject, from: ID) {
    const note = new NoteEntity(note_input.id);
    await note.create(note_input, NoteEntity.filter);

    const relationship = new NoteUserRelation(note_input.id, from);
    const relationshipObject = this.defaultNoteOwner(note.id(), from);
    await relationship.create(relationshipObject, NoteUserRelation.filter);

    await note.fetchRelations();
    await note.load();
    return note;
  }

  async processDeletion(note_id: string, from_id: string) {
    const note = new NoteEntity(note_id);
    await note.fetchRelations();
    await note.load();

    const noteUsers = note.getRelations().users as NoteUserRelation[];
    const noteDeleter = noteUsers.find((x) => x.entityId() === from_id);

    if (noteDeleter && noteDeleter.permission() === Permission.Owner) {
      await note.delete(true);
    } else {
      throw new LyfError('Notes can only be deleted by their owner', 403);
    }
  }

  async processUpdate(id: ID, changes: Partial<UserRelatedNote>, from: ID) {
    const note = new NoteEntity(id);

    await note.fetchRelations();
    await note.load();
    await note.update(changes);

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer or Invited
    this.throwIfReadOnly(note, from);

    this.logger.debug(`User ${from} safely updated note ${id}`);

    await note.save();
    return note;
  }

  async getUserNotes(user_id: ID) {
    // Validate the requestor has permission - must be themselves or a Best Friend
    const user = await new UserService().getEntity(user_id, "notes");
    const userRelatedNotes = user.getRelations().notes || [];
    const exportedNotes = [];

    for (const note of userRelatedNotes) {
      // TODO: Rework the synchronous command types to not return promises
      exportedNotes.push(await note.export())
    }

    return exportedNotes;
  }

  private defaultNoteOwner(note_id: ID, user_id: ID): NoteUserRelationshipDbObject {
    return {
      user_id_fk: user_id,
      note_id_fk: note_id,
      created: new Date(),
      last_updated: new Date(),
      invite_pending: false,
      permission: Permission.Owner
    };
  }

  private async throwIfReadOnly(note: NoteEntity, user_id: ID) {
    const noteUsers = note.getRelations().users as NoteUserRelation[];

    const permitted = noteUsers.some((x) =>
      x.entityId() === user_id &&
      x.permission() !== Permission.ReadOnly &&
      !x.invited()
    );

    if (!permitted) {
      throw new LyfError(`User ${user_id} does not have permission to edit item ${note.id()}`, 403);
    }
  }
}
