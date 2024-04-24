import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../api/schema/database/items_on_users';
import { UserDbObject } from '../../api/schema/database/user';
import { ItemRelatedUser } from '../../api/schema/items';
import { BaseRelation } from './base_relation';

export class ItemUserRelation extends BaseRelation<ItemRelatedUser> {
  protected parseBase(base_db_object: UserDbObject) {
    return base_db_object;
  }

  protected parseRelation(relation_db_object: ItemUserRelationshipDbObject): ItemUserRelations {
    const { user_id_fk, item_id_fk, ...relations } = relation_db_object;
    return relations;
  }

  protected parse(
    base_db_object: UserDbObject,
    relation_db_object: ItemUserRelationshipDbObject
  ): ItemRelatedUser {
    return {
      ...this.parseBase(base_db_object),
      ...this.parseRelation(relation_db_object)
    };
  }
}
