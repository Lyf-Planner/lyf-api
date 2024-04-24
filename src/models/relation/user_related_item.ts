import { ItemDbObject } from '../../api/schema/database/items';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../api/schema/database/items_on_users';
import { UserRelatedItem } from '../../api/schema/user';
import { BaseRelation } from './base_relation';

export class UserItemRelation extends BaseRelation<UserRelatedItem> {
  protected parseBase(base_db_object: ItemDbObject): ItemDbObject {
    return base_db_object;
  }

  protected parseRelation(relation_db_object: ItemUserRelationshipDbObject): ItemUserRelations {
    const { item_id_fk, user_id_fk, ...relations } = relation_db_object;
    return relations;
  }

  protected parse(
    base_db_object: ItemDbObject,
    relation_db_object: ItemUserRelationshipDbObject
  ): UserRelatedItem {
    return {
      ...this.parseBase(base_db_object),
      ...this.parseRelation(relation_db_object)
    };
  }
}
