import { ID } from '../../../schema/database/abstract';
import { Permission } from '../../../schema/database/items_on_users';
import { NoteDbObject } from '../../../schema/database/notes';
import { NoteUserRelationshipDbObject } from '../../../schema/database/notes_on_users';
import { UserRelatedNote } from '../../../schema/user';
import { NoteEntity } from '../../models/entity/note_entity';
import { NoteChildRelation } from '../../models/relation/note_child';
import { NoteUserRelation } from '../../models/relation/note_related_user';
import { UserNoteRelation } from '../../models/relation/user_related_note';
import { NoteChildRepository } from '../../repository/relation/note_child_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { EntityService } from './_entity_service';

export class NoteService extends EntityService<NoteDbObject> {
  protected logger = Logger.of(NoteService);

  async getEntity(note_id: ID, include?: string) {
    const note = new NoteEntity(note_id);
    await note.load();
    await note.fetchRelations(include);

    return note;
  }

  async moveNote(note_id: ID, parent_id: ID | 'root', requestor: ID) {
    const note = await this.getEntity(note_id, 'users');
    const permission = await note.getPermission(requestor);

    if (!permission) {
      throw new LyfError('Unauthorised', 403);
    }

    // start by deleting all parents that i have access to
    // this avoids the pitfall where i move the note, and it disappears for other users who have it in their private folder
    const noteChildRepository = new NoteChildRepository();
    await noteChildRepository.deleteParentsUserCanAccess(note_id, requestor);

    if (parent_id === 'root') {
      // check the definition of a root note;
      // all we need to do here is ensure we have a direct relation, since parents are deleted
      const directlyRelatedUsers = await NoteUserRelation.getDirectlyRelatedUsers(note_id);
      const hasDirectRelation = directlyRelatedUsers.map((user) => user.id).includes(requestor);

      if (!hasDirectRelation) {
        const relationship = new NoteUserRelation(note_id, requestor);
        const relationshipObject = this.defaultNoteOwner(note.id(), requestor, -1);
        await relationship.create(relationshipObject, NoteUserRelation.filter);
      }
    } else {
      // for the note and all it's descendants,
      // create a relation with the new parent, and all of it's parents
      await noteChildRepository.attachSubtree(note_id, parent_id);
    }
   
  }

  async processCreation(note_input: NoteDbObject, from: ID, sorting_rank: number, parent_id?: ID) {
    const note = new NoteEntity(note_input.id);
    await note.create(note_input, NoteEntity.filter);

    const relationship = new NoteUserRelation(note_input.id, from);
    const relationshipObject = this.defaultNoteOwner(note.id(), from, sorting_rank);
    await relationship.create(relationshipObject, NoteUserRelation.filter);

    if (parent_id) {
      const parentRelationship = new NoteChildRelation(parent_id, note_input.id);
      const parentRelationshipObject = {
        ...note_input,
        child_id: note_input.id,
        parent_id,
        sorting_rank: sorting_rank,
        distance: 1
      };
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

    this.logger.info(`Processing changeset ${JSON.stringify(changes)} on item ${id}`);

    const noteRelation = new UserNoteRelation(from, id);
    await noteRelation.load();
    await noteRelation.getRelatedEntity().fetchRelations();

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer or Invited
    this.throwIfReadOnly(noteRelation, from);

    await noteRelation.update(changes);

    this.logger.debug(`User ${from} safely updated note ${id}`);

    await noteRelation.save();
    await noteRelation.getRelatedEntity().save();
    return noteRelation;
  }

  async sortChildren(parent_id: ID, preferences: ID[], requestor: ID) {
    const parentNote = new NoteEntity(parent_id);
    await parentNote.load();
    await parentNote.fetchRelations();

    if (!await parentNote.getPermission(requestor)) {
      throw new LyfError('unauthorised', 401);
    }
   
    if (!parentNote.getRelations().notes) {
      throw new LyfError('unable to load children of note ' + parent_id, 500);
    }

    const childNotes = parentNote.getRelations().notes || [];

    for (const childNote of childNotes) {
      const newRank = preferences.indexOf(childNote.child_id())
      if (newRank !== -1) {
        await childNote.update({ sorting_rank: newRank })
        await childNote.save();
      }
    }

    return parentNote.exportWithPermission(requestor)
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

  private defaultNoteOwner(note_id: ID, user_id: ID, sorting_rank: number): NoteUserRelationshipDbObject {
    return {
      user_id_fk: user_id,
      note_id_fk: note_id,
      created: new Date(),
      last_updated: new Date(),
      invite_pending: false,
      permission: Permission.Owner,
      sorting_rank_preference: sorting_rank
    };
  }

  private async throwIfReadOnly(note: UserNoteRelation, user_id: ID) {
    const relation = await note.getRelatedEntity().getPermission(user_id);

    if (!relation || relation.permission === Permission.ReadOnly) {
      throw new LyfError(`User ${user_id} does not have permission to edit item ${note.id()}`, 403);
    }
  }
}
