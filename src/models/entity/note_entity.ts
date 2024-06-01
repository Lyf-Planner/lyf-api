import { ID } from '../../api/schema/database/abstract';
import { NoteDbObject } from '../../api/schema/database/notes';
import { Note } from '../../api/schema/notes';
import { NoteRepository } from '../../repository/entity/note_repository';
import { ItemNoteRepository } from '../../repository/relation/item_note_repository';
import { ItemUserRepository } from '../../repository/relation/item_user_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { CommandType } from '../command_types';
import { NoteItemRelation } from '../relation/note_related_item';
import { NoteUserRelation } from '../relation/note_related_user';
import { SocialEntity } from './_social_entity';

export type NoteModelRelations = {
  items: NoteItemRelation[];
  users: NoteUserRelation[];
};

export class NoteEntity extends SocialEntity<NoteDbObject> {
  protected logger = Logger.of(NoteEntity);
  protected repository = new NoteRepository();

  protected relations: Partial<NoteModelRelations> = {};

  static filter(object: any): NoteDbObject {
    return {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      title: object.title,
      type: object.type,
      content: object.content
    }
  }

  public async export(requestor?: ID, with_relations: boolean = true): Promise<Note|NoteDbObject> {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.id());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load an item they should not have access to', 401);
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
      const noteItemsRepo = new ItemNoteRepository();
      const relationObjects = await noteItemsRepo.findRelationsByIdB(this._id);
      const itemRelations: NoteItemRelation[] = [];

      for (const relationObject of relationObjects) {
        const itemRelation = new NoteItemRelation(relationObject.note_id_fk, relationObject.item_id_fk);
        itemRelations.push(itemRelation);
      }
      this.relations.items = itemRelations;
    }

    if (toLoad.includes('users')) {
      const noteUsersRepo = new NoteUserRepository();
      const relationObjects = await noteUsersRepo.findRelationsByIdA(this._id);
      const userRelations: NoteUserRelation[] = [];

      for (const relationObject of relationObjects) {
        const userRelation = new NoteUserRelation(relationObject.note_id_fk, relationObject.user_id_fk);
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
