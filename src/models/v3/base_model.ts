import { Entity, EntityGraph, EntitySubgraph, GraphExport } from '../../api/schema';
import { DbObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { UserID } from '../../api/schema/database/user';
import { BaseRepository } from '../../repository/base_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { CommandType } from './command_types';



export abstract class BaseModel<T extends Entity> {
  protected _id: ID | UserID;

  protected baseEntity?: T;
  protected relations: Record<string, BaseModel<Entity>|BaseModel<Entity>[]> = {};

  protected abstract logger: Logger;
  protected abstract repository: BaseRepository<DbObject>

  public id() { return this._id };

  public abstract delete(): Promise<void>;
  public abstract export(requestor?: UserID): Promise<EntityGraph>;
  public extract(): Promise<EntityGraph> { return this.baseEntityGraph() }
  public abstract load(relations: object): Promise<void>;
  public abstract validate(requirements?: object): Promise<void>;
  public abstract update(changes: Partial<EntityGraph>): Promise<void>;

  protected abstract save(): Promise<void>;
  
  constructor(id: ID | UserID) {
    this._id = id;
  }

  // Should be called by each of the major commands
  // Return value may be unused and may not actually be async
  public async recurseRelations<K>(
    command: CommandType,
    payload?: Record<string, any>
  ): Promise<Record<string, K|K[]>> {
    const recursedRelations: Record<string, K|K[]> = {};

    for (const [key, value] of Object.entries(this.relations)) {
      // Handle relations being an array
      if (Array.isArray(value)) {
        const relationArray = [];

        for (const model of value) {
          let relevantPayload;

          if (payload && Array.isArray(payload?.[key])) {
            relevantPayload = payload?.[key].find((x: BaseModel<Entity>) => x.id() === model.id());
          }
          
          relationArray.push(await this.handleCommand(command, model, relevantPayload) as K)
        }

        recursedRelations[key] = relationArray;
      } else {
        recursedRelations[key] = this.handleCommand(command, value as BaseModel<Entity>, payload?.[key]) as K
      }

    }

    return recursedRelations;
  }

  public async handleCommand(command: CommandType, model: BaseModel<Entity>, payload?: any) {
    switch (command) {
      case CommandType.Delete:
        return await model.delete();
      case CommandType.Export:
        return await model.export();
      case CommandType.Extract:
        return await model.extract();
      case CommandType.Load:
        return await model.load(payload);
      case CommandType.Save:
        return await model.save();
      case CommandType.Update:
        return await model.update(payload);
      case CommandType.Validate:
        return await model.validate(payload);
    }
  }

  // Extract is the one command type we can just do straight on the BaseModel
  private async baseEntityGraph(): Promise<EntityGraph> {
    if (!this.baseEntity) {
      throw new LyfError('Server did not load Model before extraction', 500);
    }

    return {
      ...this.baseEntity,
      relations: await this.recurseRelations<EntitySubgraph>(CommandType.Extract),
    };
  }
}
