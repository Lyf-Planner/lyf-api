import { Entity } from '../../api/schema';
import { ID } from '../../api/schema/database/abstract';
import { UserID } from '../../api/schema/database/user';
import { LyfError } from '../../utils/lyf_error';
import { CommandType } from './command_types';

export type ModelExtract = Entity & {
  relations: Record<string, ModelExtract>;
};

export abstract class BaseModel<T extends Entity> {
  protected _id: ID | UserID;

  protected baseEntity?: T;
  protected relations: Record<string, BaseModel<Entity>> = {};

  public id() { return this._id };

  public abstract delete(): Promise<null>;
  public abstract export(requestor?: UserID): Promise<ModelExtract>;
  public extract(): Promise<ModelExtract> { return this.baseModelExtract() }
  public abstract load(relations: object): Promise<Partial<T>>;
  public abstract validate(requirements?: object): Promise<void>;
  public abstract update(changes?: Partial<T>): Promise<Partial<T>>;
  protected abstract save(): Promise<Partial<T>>;
  
  constructor(id: ID | UserID) {
    this._id = id;
  }

  // Should be called by each of the major commands
  // Return value may be unused and may not actually be async
  public async recurseRelations<K>(
    command: CommandType,
    payload?: Partial<T>
  ): Promise<Record<string, K>> {
    const recursedRelations: Record<string, K> = {};

    for (const [key, value] of Object.entries(this.relations)) {
      recursedRelations[key] = await this.handleCommand(command, value, payload) as K
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
  private async baseModelExtract(): Promise<ModelExtract> {
    if (!this.baseEntity) {
      throw new LyfError('Server did not load Model before extraction', 500);
    }

    return {
      ...this.baseEntity,
      relations: await this.recurseRelations<ModelExtract>(CommandType.Extract),
    };
  }
}
