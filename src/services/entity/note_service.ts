import { NoteDbObject } from '../../api/schema/database/notes';
import { ID } from '../../api/schema/database/abstract';
import { NoteEntity } from '../../models/v3/entity/note_entity';
import { Logger } from '../../utils/logging';
import { EntityService } from './_entity_service';
import { Note } from '../../api/schema/notes';
import { NoteUserRelation } from '../../models/v3/relation/note_related_user';
import { NoteUserPermission, NoteUserRelationshipDbObject } from '../../api/schema/database/notes_on_users';
import { LyfError } from '../../utils/lyf_error';
import { UserRelatedNote } from '../../api/schema/user';
import { UserEntity } from '../../models/v3/entity/user_entity';

export class NoteService extends EntityService<NoteDbObject> {
  protected logger = Logger.of(NoteService);

  constructor() {
    super();
  }

  // Builder method
  public async retrieveForUser(note_id: ID, requestor_id: ID, include: string): Promise<Note> {
    const note = new NoteEntity(note_id);
    await note.fetchRelations(include);
    await note.load();
    
    const retrieved = await note.export(requestor_id) as Note;
    return retrieved
  }

  async processCreation(note_input: NoteDbObject, from: ID): Promise<Note> {
    const note = new NoteEntity(note_input.id);
    await note.create(note_input);

    const relationship = new NoteUserRelation(note_input.id, from);
    const relationshipObject = this.defaultNoteOwner(note.id(), from)
    await relationship.create(relationshipObject);

    await note.fetchRelations();
    return await note.export() as Note;
  }

  async processUpdate(id: ID, changes: Partial<UserRelatedNote>, from: ID) {
    const note = new NoteEntity(id);

    await note.load();
    await note.update(changes);

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer or Invited
    this.throwIfReadOnly(note, from);

    this.logger.debug(`User ${from} safely updated note ${id}`);

    await note.save();
    return note.export();
  }

  private defaultNoteOwner(note_id: ID, user_id: ID): NoteUserRelationshipDbObject {
    return {
      user_id_fk: user_id,
      note_id_fk: note_id,
      created: new Date(),
      last_updated: new Date(),
      invite_pending: false,
      permission: NoteUserPermission.Owner
    }
  }

  private async throwIfReadOnly(note: NoteEntity, user_id: ID) {
    await note.fetchRelations("users");
    const noteUsers = note.getRelations().users as NoteUserRelation[];

    const permitted = noteUsers.some((x) => 
      x.id() === user_id &&
      x.getPermission() !== NoteUserPermission.ReadOnly &&
      !x.isInvited()
    )

    if (!permitted) {
      throw new LyfError(`User ${user_id} does not have permission to edit item ${note.id()}`, 403);
    }
  }
}
