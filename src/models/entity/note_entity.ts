import { ID } from '../../../schema/database/abstract';
import { NoteDbObject, NoteType } from '../../../schema/database/notes';
import { NoteUserRelations } from '../../../schema/database/notes_on_users';
import { Note } from '../../../schema/notes';
import { UserRelatedNote } from '../../../schema/user';
import { ItemRepository } from '../../repository/entity/item_repository';
import { NoteRepository } from '../../repository/entity/note_repository';
import { NoteChildRepository } from '../../repository/relation/note_child_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { ObjectUtils } from '../../utils/object';
import { Extension } from '../../utils/types';
import { CommandType } from '../command_types';
import { NoteChildRelation } from '../relation/note_child';
import { NoteUserRelation } from '../relation/note_related_user';

import { SocialEntity } from './_social_entity';
import { ItemEntity } from './item_entity';

export type NoteModelRelations = {
  items: ItemEntity[];
  notes: NoteChildRelation[];
  users: NoteUserRelation[];
};

export class NoteEntity extends SocialEntity<NoteDbObject> {
  protected logger = Logger.of(NoteEntity.name);
  protected repository = new NoteRepository();

  protected relations: Partial<NoteModelRelations> = {};

  static filter(object: Extension<NoteDbObject>): NoteDbObject {
    const objectFilter: NoteDbObject = {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      title: object.title,
      type: object.type,
      content: object.content,
      collaborative: object.collaborative
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  // soft deletion is implied here
  async delete(delete_contents = true) {
    // Delete directly related user relations, including user relations on sub-notes
    const noteUserRepository = new NoteUserRepository();
    let relatedUserDeletion = noteUserRepository.deleteAllDirectRelations(this._id);
    if (delete_contents) {
      relatedUserDeletion = noteUserRepository.deleteAllDirectDescendantRelations(this._id);
    }

    // delete any remaining relations with parents
    const noteChildRepository = new NoteChildRepository();
    const relatedNoteDeletion = noteChildRepository.deleteAllParents(this._id);

    await Promise.all([relatedUserDeletion, relatedNoteDeletion])
  }

  static async getPermission(note_id: ID, requestor: ID) {
    const note = new NoteEntity(note_id);
    await note.attachUsers();

    return note.getPermission(requestor);
  }

  async getPermission(requestor: ID) {
    // getting permissions to a note is a special case, because of it's file system
    // we check the user is either on the note, or has a permission on this notes' ancestor

    if (!this.relations.users) {
      await this.attachUsers();
    }

    const relatedUsers = this.relations.users;
    if (!relatedUsers) {
      console.warn('exported user note without loading users!');
      return;
    }

    const noteRelatedUser = relatedUsers.find((user) => user.entityId() === requestor);
    if (noteRelatedUser) {
      const notePermission = noteRelatedUser.extractRelation();
      return notePermission;
    }

    this.logger.debug('using ancestor permission');
    const ancestorPermissions = await this.repository.findAncestorPermissions(this._id, requestor);

    const hasAncestorPermission = ancestorPermissions.length > 0;
    if (hasAncestorPermission) {
      const nearestPermission = ancestorPermissions.sort((a, b) => a.distance - b.distance)[0];
      return NoteUserRelation.filter(nearestPermission);
    }

    return null;
  }

  async exportWithPermission(requestor: ID, provided_permission?: NoteUserRelations): Promise<UserRelatedNote> {
    const exportedNote = await this.export(requestor, true) as Note;

    if (provided_permission) {
      return {
        ...exportedNote,
        ...provided_permission
      }
    }

    const notePermission = await this.getPermission(requestor);
    if (!notePermission) {
      throw new LyfError('User tried to load a note they should not have access to', 401);
    }

    return {
      ...exportedNote,
      ...notePermission
    }
  }

  async export(requestor: ID, with_relations: boolean = true): Promise<Note | NoteDbObject> {
    return {
      ...this.base!,
      relations: with_relations ? await this.recurseRelations(CommandType.Export, [], requestor) : {}
    };
  }

  async fetchRelations(include?: string | undefined): Promise<void> {
    const toLoad = include ? this.parseInclusions(include) : ['items', 'notes', 'users'];

    // always load items for list notes
    if (toLoad.includes('items') || this.base?.type === NoteType.ListOnly) {
      await this.attachItems();
    }

    // always load notes for folders
    if (toLoad.includes('notes') || this.base?.type === NoteType.Folder) {
      await this.attachChildNotes();
    }

    if (toLoad.includes('users')) {
      await this.attachUsers();
    }
  }

  async attachItems() {
    const itemsRepo = new ItemRepository();
    const itemObjects = await itemsRepo.findByNoteId(this._id);
    const itemRelations: ItemEntity[] = [];

    for (const itemObject of itemObjects) {
      const itemRelation = new ItemEntity(itemObject.id, itemObject);
      itemRelations.push(itemRelation);
    }
    this.relations.items = itemRelations;
  }

  async attachChildNotes() {
    const noteChildrenRepo = new NoteChildRepository();
    const noteChildrenObjects = await noteChildrenRepo.findFolderChildren(this._id);
    const noteChildren: NoteChildRelation[] = [];

    for (const note of noteChildrenObjects) {
      const childNote = new NoteChildRelation(note.parent_id, note.child_id, note);
      noteChildren.push(childNote);
    }
    this.relations.notes = noteChildren;
  }

  async attachUsers() {
    const noteUsersRepo = new NoteUserRepository();
    const relationObjects = await noteUsersRepo.findNoteRelatedUsers(this._id);
    const userRelations: NoteUserRelation[] = [];

    for (const relationObject of relationObjects) {
      const userRelation = new NoteUserRelation(relationObject.note_id_fk, relationObject.user_id_fk, relationObject);
      userRelations.push(userRelation);
    }
    this.relations.users = userRelations;
  }

  public async update(changes: Partial<NoteDbObject>): Promise<void> {
    const updatedBase = NoteEntity.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  // --- HELPERS --- //
  getRelations() {
    return this.relations;
  }

  title() {
    return this.base!.title;
  }

  type() {
    return this.base!.type;
  }
}
