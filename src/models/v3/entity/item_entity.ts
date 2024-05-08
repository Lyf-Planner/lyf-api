import { EntitySubgraph } from '../../../api/schema';
import { ID } from '../../../api/schema/database/abstract';
import { UserID } from '../../../api/schema/database/user';
import { Item, ItemRelations } from '../../../api/schema/items';
import { ItemRepository } from '../../../repository/item_repository';
import { Logger } from '../../../utils/logging';
import { LyfError } from '../../../utils/lyf_error';
import { ItemModel } from '../../v2/items/itemModel';
import { CommandType } from '../command_types';
import { ItemUserRelation } from '../relation/item_related_user';
import { BaseEntity } from './base_entity';

export type ItemModelRelations = {
  items: ItemEntity; // if template_id present
  users: ItemUserRelation[];
};

export class ItemEntity extends BaseEntity<Item> {
  protected logger = Logger.of(ItemEntity);
  protected repository = new ItemRepository();

  protected relations: Partial<ItemModelRelations> = {};

  public async export(requestor?: UserID) {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.id());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load an item they should not have access to', 401);
    } else {
      return {
        ...this.baseEntity!,
        relations: await this.recurseRelations<EntitySubgraph>(CommandType.Export)
      };
    }
  }
}
