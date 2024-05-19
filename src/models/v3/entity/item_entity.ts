import { ID } from '../../../api/schema/database/abstract';
import { ItemDbObject } from '../../../api/schema/database/items';
import { NoteDbObject } from '../../../api/schema/database/notes';
import { Item } from '../../../api/schema/items';
import { Note } from '../../../api/schema/notes';
import { ItemRepository } from '../../../repository/entity/item_repository';
import { ItemUserRepository } from '../../../repository/relation/item_user_repository';
import { UserFriendshipRepository } from '../../../repository/relation/user_friendship_repository';
import { Logger } from '../../../utils/logging';
import { LyfError } from '../../../utils/lyf_error';
import { CommandType } from '../command_types';
import { ItemUserRelation } from '../relation/item_related_user';
import { UserFriendRelation } from '../relation/user_friend';
import { BaseEntity } from './base_entity';

export type ItemModelRelations = {
  items: ItemEntity; // if template_id present
  users: ItemUserRelation[];
};

export class ItemEntity extends BaseEntity<ItemDbObject> {
  protected logger = Logger.of(ItemEntity);
  protected repository = new ItemRepository();

  protected relations: Partial<ItemModelRelations> = {};

  public async export(requestor?: ID, with_relations = true): Promise<Item|ItemDbObject> {
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
      return this.base!
    } 
  }

  public async fetchRelations(include?: string | undefined): Promise<void> {
    const toLoad = include ? this.parseInclusions(include) : ["items", "users"]

    if (toLoad.includes("items") && this.base?.template_id) {
      const template = new ItemEntity(this.base.template_id);
      this.relations.items = template;
    }

    if (toLoad.includes("users")) {
      const itemUsersRepo = new ItemUserRepository();
      const relationObjects = await itemUsersRepo.findRelationsByIdA(this._id);
      const userRelations: ItemUserRelation[] = [];

      for (const relationObject of relationObjects) {
        const userRelation = new ItemUserRelation(relationObject.item_id_fk, relationObject.user_id_fk)
        userRelations.push(userRelation)
      }
      this.relations.users = userRelations;
    }
  }

  // --- HELPERS ---
  isRoutine() {
    const { date, day, template_id } = this.base!
    return day && !date && !template_id;
  }

  templateId() {
    return this.base!.template_id
  }
}
