import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../../api/schema/database/items_on_users';
import { UserDbObject } from '../../../api/schema/database/user';
import { ItemRelatedUser } from '../../../api/schema/items';
import { BaseRelation } from './base_relation';

export class ItemUserRelation extends BaseRelation<ItemRelatedUser> {
  protected parse(combined_db_object: UserDbObject & ItemUserRelationshipDbObject) {
    const { user_id_fk, item_id_fk, ...parsed } = combined_db_object;
    return parsed;
  }
}
