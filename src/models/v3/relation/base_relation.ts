import { EntitySubgraph } from '../../../api/schema';
import { DbBaseObject, DbObject, DbRelationFields } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { UserID } from '../../../api/schema/database/user';
import { BaseRepository } from '../../../repository/base_repository';
import { LyfError } from '../../../utils/lyf_error';
import { BaseModel } from '../base_model';
import { CommandType } from '../command_types';

export abstract class BaseRelation<T extends DbBaseObject> extends BaseModel<T> {
  protected _parentId: ID | UserID;

  protected abstract relationFields: DbRelationFields;
  protected abstract relationRepository: BaseRepository<DbObject>

  // The ID should be the target entity, the parent ID is the relation it was accessed from
  // E.g ItemRelatedUser => id = user_id, parent_id = item_id
  constructor(base_entity: T, id: ID | UserID, parent_id: ID | UserID, relation_fields: DbRelationFields) {
    super(base_entity, id);
    this._parentId = parent_id;
  }

  public parentId() { return this._parentId };

  // Clarification - this adds fields to the retrieved base object that are from the relation object, used during loading.
  protected abstract addRelationFields(relation_fields: DbRelationFields): Promise<void>;
  // For use during updates
  protected abstract checkRelationFieldUpdates(): Promise<void>

  public async delete() {
    await this.relationRepository.delete(this._id);
    await this.recurseRelations(CommandType.Delete);
  }

  public async load(relations: object) {
    const dbObject = await this.repository.findById(this._id) as T;
    if (!dbObject) {
      throw new LyfError(`Model with id ${this._id} does not have a database entry in ${this.repository}`, 500)  
    }

    this.baseEntity = dbObject;
  }

  protected async save() {
    if (!this.baseEntity) {
      throw new LyfError('Model was saved before being loaded', 500);
    }

    await this.repository.update(this._id, this.baseEntity)
    await this.recurseRelations(CommandType.Save);
  }

  public async update(changes: Partial<EntitySubgraph>) {
    if (!this.baseEntity) {
      throw new LyfError('Model was updated before being loaded', 500);
    }

    const { relations, ...baseChanges } = changes;

    this.baseEntity = { ...this.baseEntity, ...baseChanges };
    await this.repository.update(this._id, baseChanges);

    await this.recurseRelations<EntitySubgraph>(CommandType.Update, relations);
  }
}
