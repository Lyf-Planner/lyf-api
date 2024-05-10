import { DbEntityObject, DbObject, DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { RelationRepository } from '../../../repository/relation_repository';
import { BaseModel } from '../base_model';

export abstract class BaseRelation<T extends DbEntityObject, K extends DbRelationObject> extends BaseModel<T> {
  protected _parentId: ID;

  protected abstract relationFields: DbRelationFields;
  protected abstract relationRepository: RelationRepository<K>

  // The ID should be the target entity, the parent ID is the relation it was accessed from
  // E.g ItemRelatedUser => id = user_id, parent_id = item_id
  constructor(id: ID, parent_id: ID) {
    super(id);
    this._parentId = parent_id;
  }

  public parentId() { return this._parentId };

  protected abstract checkRelationFieldUpdates(): Promise<void>
  protected abstract deleteRelation(): Promise<void>
  protected abstract extractRelationFields(db_relation_object: DbRelationObject): Promise<DbRelationFields>;
}
