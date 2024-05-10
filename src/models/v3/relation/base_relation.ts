import { EntitySubgraph, Relation } from '../../../api/schema';
import { DbBaseObject, DbObject, DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { UserID } from '../../../api/schema/database/user';
import { BaseRepository } from '../../../repository/base_repository';
import { LyfError } from '../../../utils/lyf_error';
import { BaseModel } from '../base_model';
import { CommandType } from '../command_types';

export abstract class BaseRelation<T extends Relation> extends BaseModel<T> {
  protected _parentId: ID | UserID;

  protected abstract relationFields: DbRelationFields;
  protected abstract relationRepository: BaseRepository<DbObject>

  // The ID should be the target entity, the parent ID is the relation it was accessed from
  // E.g ItemRelatedUser => id = user_id, parent_id = item_id
  constructor(id: ID | UserID, parent_id: ID | UserID) {
    super(id);
    this._parentId = parent_id;
  }

  public parentId() { return this._parentId };

  protected abstract extractRelationFields(db_relation_object: DbRelationObject): Promise<DbRelationFields>;
  protected abstract checkRelationFieldUpdates(): Promise<void>

  public delete(delete_target = false) {
    this.relationRepository.delete()
  }
}
