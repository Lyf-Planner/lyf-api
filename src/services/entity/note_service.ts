import { ID } from '../../../schema/database/abstract';
import { Permission } from '../../../schema/database/items_on_users';
import { NoteDbObject, NoteType } from '../../../schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../../schema/database/notes_on_users';
import { UserRelatedNote } from '../../../schema/user';
import { NoteEntity } from '../../models/entity/note_entity';
import { NoteChildRelation } from '../../models/relation/note_child';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { UserNoteRelation } from '../../models/relation/user_related_note';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
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

  async processCreation(note_input: NoteDbObject, from: ID, parent_id?: ID) {
    const note = new NoteEntity(note_input.id);
    await note.create(note_input, NoteEntity.filter);

    const relationship = new NoteUserRelation(note_input.id, from);
    const relationshipObject = this.defaultNoteOwner(note.id(), from);
    await relationship.create(relationshipObject, NoteUserRelation.filter);

    if (parent_id) {
      const parentRelationship = new NoteChildRelation(parent_id, note_input.id);
      const parentRelationshipObject = { ...note_input, child_id: note_input.id, parent_id, distance: 1 };
      await parentRelationship.create(parentRelationshipObject);
    }

    await note.fetchRelations();
    await note.load();
    return note;
  }

  async processDeletion(note_id: string, from_id: string) {
    const note = new NoteEntity(note_id);
    await note.fetchRelations();
    await note.load();

    const notePermission = await note.getPermission(from_id)

    // TODO LYF-371: Make it so Editors can delete notes in folders, but not folders themselves
    if (notePermission && (
      notePermission.permission === Permission.Owner || 
      notePermission.permission === Permission.Editor
    )) {
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

  async getUserNotes(user_id: ID) {
    const noteUserRepository = new NoteUserRepository();
    const rootNotes = await noteUserRepository.findRootNotes(user_id)
    const exportedNotes: UserRelatedNote[] = [];

    for (const rootNoteRelation of rootNotes) {
      const userNoteRelation = new UserNoteRelation(user_id, rootNoteRelation.note_id_fk, rootNoteRelation)
      exportedNotes.push(await userNoteRelation.export())
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
