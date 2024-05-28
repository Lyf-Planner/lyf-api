import { Export, Entity } from '../../../api/schema';
import { DbEntityObject, DbObject, DbRelationObject } from '../../../api/schema/database';
import { EntityRepository } from '../../../repository/entity/_entity_repository';
import { LyfError } from '../../../utils/lyf_error';
import { BaseModel } from '../base_model';
import { CommandType } from '../command_types';
import { BaseRelation } from '../relation/base_relation';

export abstract class BaseEntity<T extends DbEntityObject> extends BaseModel<T> {
  protected relations: Record<string, BaseRelation<DbRelationObject, BaseEntity<DbEntityObject>> | 
                                      BaseRelation<DbRelationObject, BaseEntity<DbEntityObject>>[]> = {};
  protected abstract repository: EntityRepository<T>;

  public abstract fetchRelations(include?: string): Promise<void>

  public async delete() {
    await this.repository.delete(this._id);
    await this.recurseRelations(CommandType.Delete);
  }

  public async extract(with_relations = true): Promise<Entity|T> {
    if (with_relations) {
      return {
        ...this.base!,
        relations: await this.recurseRelations(CommandType.Extract)
      }
    }

    return this.base!;
  }

  public async load() {
    const dbObject = await this.repository.findById(this._id) as T;
    if (!dbObject) {
      throw new LyfError(`Model with id ${this._id} does not have a database entry in ${this.repository}`, 500);
    }

    this.base = dbObject;
    await this.recurseRelations(CommandType.Load);
  }

  // Should be called by each of the major commands
  // Return value may be unused and may not actually be async
  public async recurseRelations<K>(
    command: CommandType,
    payload?: Record<string, any>
  ): Promise<Record<string, K | K[]>> {
    const recursedRelations: Record<string, K | K[]> = {};

    for (const [key, value] of Object.entries(this.relations)) {
      // Handle relations being an array
      if (Array.isArray(value)) {
        const relationArray = [];
        for (const model of value) {
          let relevantPayload;

          if (payload && Array.isArray(payload?.[key])) {
            relevantPayload = payload?.[key].find((x: BaseModel<DbEntityObject>) => x.id() === model.id());
          }

          relationArray.push((await this.handleCommand(command, model, relevantPayload)) as K);
        }

        recursedRelations[key] = relationArray;
      } else {
        recursedRelations[key] = this.handleCommand(
          command,
          value as BaseModel<DbObject>,
          payload?.[key]
        ) as K;
      }
    }

    return recursedRelations;
  }

  public async save() {
    if (!this.base) {
      throw new LyfError('Model was saved before being loaded', 500);
    }

    await this.repository.update(this._id, this.base);
    await this.recurseRelations(CommandType.Save);
  }

  public async update(changes: Partial<Entity>) {
    if (!this.base) {
      throw new LyfError('Model was updated before being loaded', 500);
    }

    const { relations, ...baseChanges } = changes;
    this.base = { ...this.base, ...baseChanges };

    await this.recurseRelations(CommandType.Update, relations);
  }

  protected parseInclusions(include: string) {
    const parsedString = include.replace('include=', '').split(',');

    const includedRelations: any = []
    for (const inclusion of parsedString) {
      includedRelations[inclusion] = {};
    }

    return includedRelations;
  }
}
