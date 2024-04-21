import { ItemNoteRelationship } from '../api/schema/items_on_notes';
import { UserID } from '../api/schema/user';
import { BaseModel } from './base_model';

export class ItemNoteRelationshipModel extends BaseModel<ItemNoteRelationship> {
  constructor(content: ItemNoteRelationship, requestor: UserID) {
    super(content, requestor);
  }
}
