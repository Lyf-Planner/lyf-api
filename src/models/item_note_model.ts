import { ItemNoteRelationship } from '../api/schema/items_on_notes';
import { User } from '../api/schema/user';
import { BaseModel } from './base_model';

export class ItemNoteRelationshipModel extends BaseModel<ItemNoteRelationship> {
  constructor(content: ItemNoteRelationship, requestor: User) {
    super(content, requestor);
  }
}
