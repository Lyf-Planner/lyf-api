import { ItemUserRelationship } from '../api/schema/items_on_users';
import { UserID } from '../api/schema/user';
import { BaseModel } from './base_model';

export class ItemUserRelationshipModel extends BaseModel<ItemUserRelationship> {
  constructor(content: ItemUserRelationship, requestor: UserID) {
    super(content, requestor);
  }
}
