import { ItemUserRelationship } from '../api/schema/items_on_users';
import { User } from '../api/schema/user';
import { BaseModel } from './base_model';

export class ItemUserRelationshipModel extends BaseModel<ItemUserRelationship> {
  constructor(content: ItemUserRelationship, requestor: User) {
    super(content, requestor);
  }
}
