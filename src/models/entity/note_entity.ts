import { ID } from '../../types/schema/database/abstract';
import { NoteDbObject } from '../../types/schema/database/notes';
import { Note } from '../../types/schema/notes';
import { ItemRepository } from '../../repository/entity/item_repository';
import { NoteRepository } from '../../repository/entity/note_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { ObjectUtils } from '../../utils/object';
import { CommandType } from '../command_types';
import { NoteUserRelation } from '../relation/note_related_user';
import { SocialEntity } from './_social_entity';
import { ItemEntity } from './item_entity';

export type NoteModelRelations = {
  items: ItemEntity[];
  users: NoteUserRelation[];
};

export class NoteEntity extends SocialEntity<NoteDbObject> {
  protected logger = Logger.of(NoteEntity);
  protected repository = new NoteRepository();

  protected relations: Partial<NoteModelRelations> = {};

  static filter(object: any): NoteDbObject {
    const objectFilter: Required<NoteDbObject> = {
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

  public async export(requestor?: ID, with_relations: boolean = true): Promise<Note|NoteDbObject> {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.entityId());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load a note they should not have access to', 401);
    }

    if (with_relations) {
      return {
        ...this.base!,
        relations: await this.recurseRelations(CommandType.Export)
      };
    } else {
      return this.base!;
    }
  }

  public async fetchRelations(include?: string | undefined): Promise<void> {
    const toLoad = include ? this.parseInclusions(include) : ['items', 'users'];

    if (toLoad.includes('items')) {
      const itemsRepo = new ItemRepository();
      const itemObjects = await itemsRepo.findByNoteId(this._id);
      const itemRelations: ItemEntity[] = [];

      for (const itemObject of itemObjects) {
        const itemRelation = new ItemEntity(itemObject.id, itemObject);
        itemRelations.push(itemRelation);
      }
      this.relations.items = itemRelations;
    }

    if (toLoad.includes('users')) {
      const noteUsersRepo = new NoteUserRepository();
      const relationObjects = await noteUsersRepo.findNoteRelatedUsers(this._id);
      const userRelations: NoteUserRelation[] = [];

      for (const relationObject of relationObjects) {
        const userRelation = new NoteUserRelation(relationObject.note_id_fk, relationObject.user_id_fk, relationObject);
        userRelations.push(userRelation);
      }
      this.relations.users = userRelations;
    }
  }

  // --- HELPERS --- //
  public getRelations() {
    return this.relations;
  }
}
