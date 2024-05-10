import { EntityGraph, EntityGraphRoot, EntitySubgraph } from '../../../api/schema';
import { DbEntityObject } from '../../../api/schema/database';
import { EntityRepository } from '../../../repository/entity_repository';
import { LyfError } from '../../../utils/lyf_error';
import { BaseModel } from '../base_model';
import { CommandType } from '../command_types';

export abstract class BaseEntity<T extends DbEntityObject> extends BaseModel<T> {
  protected abstract repository: EntityRepository<T>

  public async delete() {
    await this.repository.delete(this._id);
    await this.recurseRelations(CommandType.Delete);
  }

  public async load(relations: object, recurse = true) {
    const dbObject = await this.repository.findById(this._id) as T;
    if (!dbObject) {
      throw new LyfError(`Model with id ${this._id} does not have a database entry in ${this.repository}`, 500)  
    }

    this.baseEntity = dbObject;
    await this.recurseRelations(CommandType.Load);
  }

  protected async save() {
    if (!this.baseEntity) {
      throw new LyfError('Model was saved before being loaded', 500);
    }

    await this.repository.update(this._id, this.baseEntity)
    await this.recurseRelations(CommandType.Save);
  }

  public async update(changes: Partial<EntityGraphRoot<DbEntityObject>>) {
    if (!this.baseEntity) {
      throw new LyfError('Model was updated before being loaded', 500);
    }

    const { relations, ...baseChanges } = changes;

    this.baseEntity = { ...this.baseEntity, ...baseChanges };
    await this.repository.update(this._id, baseChanges as T);

    await this.recurseRelations<EntitySubgraph>(CommandType.Update, relations);
  }
}
