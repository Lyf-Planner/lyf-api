import { ItemDbObject } from '../../api/schema/database/items';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../api/schema/database/items_on_users';
import { UserRelatedItem } from '../../api/schema/user';
import { BaseRelation } from './base_relation';

export class UserItemRelation extends BaseRelation<UserRelatedItem> {
  protected parse(combined_db_object: ItemDbObject & ItemUserRelationshipDbObject) {
    const { item_id_fk, user_id_fk, ...parsed } = combined_db_object;
    return parsed;
  }
}
