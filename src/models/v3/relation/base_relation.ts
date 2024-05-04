import { Relation } from '../../../api/schema';
import { DbRelationFields } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { UserID } from '../../../api/schema/database/user';
import { BaseModel } from '../base_model';

export abstract class BaseRelation<T extends Relation> extends BaseModel<T> {
  protected _parentId: ID | UserID;

  // The ID should be the target entity, the parent ID is the relation it was accessed from
  // E.g ItemRelatedUser => id = user_id, parent_id = item_id
  constructor(id: ID | UserID, parent_id: ID | UserID) {
    super(id);
    this._parentId = parent_id;
  }

  public parentId() { return this._parentId };

  // Clarification - this adds fields to the retrieved base object that are from the relation object
  protected abstract addRelationFields(relation_fields: DbRelationFields): Promise<void>;
}
