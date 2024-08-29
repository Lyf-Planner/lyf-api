import { DbEntityObject, DbRelationObject } from '../../types/schema/database';
import { ID } from '../../types/schema/database/abstract';
import { BaseModel } from '../_base_model';
import { BaseEntity } from '../entity/_base_entity';

export abstract class BaseRelation<T extends DbRelationObject, K extends BaseEntity<DbEntityObject>> extends BaseModel<T> {
  protected _entityId: ID;

  protected abstract relatedEntity: K;

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
