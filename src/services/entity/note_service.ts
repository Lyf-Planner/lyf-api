import { ID } from '../../api/schema/database/abstract';
import { Permission } from '../../api/schema/database/items_on_users';
import { NoteDbObject } from '../../api/schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../api/schema/database/notes_on_users';
import { UserRelatedNote } from '../../api/schema/user';
import { NoteEntity } from '../../models/entity/note_entity';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { EntityService } from './_entity_service';

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
    await note.create(note_input);

    const relationship = new NoteUserRelation(note_input.id, from);
    const relationshipObject = this.defaultNoteOwner(note.id(), from);
    await relationship.create(relationshipObject);

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
      await note.delete();
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
      x.id() === user_id &&
      x.permission() !== Permission.ReadOnly &&
      !x.invited()
    );

    if (!permitted) {
      throw new LyfError(`User ${user_id} does not have permission to edit item ${note.id()}`, 403);
    }
  }
}
