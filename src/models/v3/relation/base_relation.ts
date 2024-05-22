import { DbEntityObject, DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { BaseModel } from '../base_model';
import { BaseEntity } from '../entity/base_entity';

export abstract class BaseRelation<T extends DbRelationObject, K extends DbEntityObject, > extends BaseModel<T> {
  protected _entityId: ID;

  protected abstract relatedEntity: BaseEntity<K>

  // The ID should be the target entity, the parent ID is the relation it was accessed from
  // E.g ItemRelatedUser => id = user_id, parent_id = item_id
  constructor(id: ID, entity_id: ID) {
    super(id);
    this._entityId = entity_id;
  }
  
  public entityId() { return this._entityId; }
  public extractRelation() {
    return this.base!;
  }
  public getRelatedEntity() {
    return this.relatedEntity;
  }
}
