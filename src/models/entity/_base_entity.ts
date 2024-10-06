import { Entity } from '../../../schema';
import { DbEntityObject, DbObject } from '../../../schema/database';
import { EntityRepository } from '../../repository/entity/_entity_repository';
import { LyfError } from '../../utils/lyf_error';
import { ObjectUtils } from '../../utils/object';
import { BaseModel } from '../_base_model';
import { CommandType } from '../command_types';
import { BaseRelation } from '../relation/_base_relation';

type EntityRelations = Record<string, BaseModel<DbObject> | BaseModel<DbObject>[]> 


export abstract class BaseEntity<T extends DbEntityObject> extends BaseModel<T> {
  protected relations: EntityRelations = {};
  protected abstract repository: EntityRepository<T>;

  public abstract fetchRelations(include?: string): Promise<void>;
  public abstract getRelations(): any;

  public async delete(softDelete = false) {
    await this.recurseRelations(CommandType.Delete);

    if (!softDelete) {
      await this.repository.delete(this._id);
    }
  }

  public async extract(with_relations = true): Promise<Entity|T> {
    if (with_relations) {
      return {
        ...this.base!,
        relations: await this.recurseRelations(CommandType.Extract)
      };
    }

    return this.base!;
  }

  public async load() {
    const dbObject = await this.repository.findById(this._id) as T;
    if (!dbObject) {
      throw new LyfError(`${this._id} does not exist`, 404);
    }

    this.base = dbObject;
  }

  // Should be called by each of the major commands
  // Return value may be unused and may not actually be async
  public async recurseRelations<K>(
    command: CommandType,
    exclude_relations?: string[],
  ): Promise<Record<string, K | K[]>> {
    const recursedRelations: Record<string, K | K[]> = {};

    for (const [key, value] of Object.entries(this.relations)) {
      if (exclude_relations && exclude_relations.includes(key)) {
        continue;
      }

      // Handle relations being an array
      if (Array.isArray(value)) {
        const relationArray = [];
        for (const model of value) {
          let relevantPayload;

          relationArray.push((await this.handleCommand(command, model, relevantPayload)) as K);
        }

        recursedRelations[key] = relationArray;
      } else {
        recursedRelations[key] = this.handleCommand(
          command,
          value as BaseModel<DbObject>
        ) as K;
      }
    }

    return recursedRelations;
  }

  public async save() {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.update(this._id, this.changes);
    }

    await this.recurseRelations(CommandType.Save);
  }

  public async update(changes: Partial<T>) {
    if (!this.base) {
      throw new LyfError('Model was updated before being loaded', 500);
    }

    this.changes = changes;
    this.base = { ...this.base, ...changes };
  }

  // Modify, unlike update which makes a local change, or save which pushes changes,
  // Just makes a modification straight to the database without loading.
  public async directlyModify(changes: Partial<T>) {
    await this.repository.update(this._id, changes);
  }

  protected parseInclusions(include: string) {
    return include.split(',');
  }
}
