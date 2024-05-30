import { Entity, Export, Relation } from '../../api/schema';
import { DbEntityObject, DbObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { BaseRepository } from '../../repository/_base_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { CommandType } from './command_types';

export abstract class BaseModel<T extends DbObject> {
  protected _id: ID;

  protected base?: T;

  protected abstract logger: Logger;
  protected abstract repository: BaseRepository<T>;

  public id() {
    return this._id;
  }

  public async create(db_object: T) {
    const uploaded = await this.repository.create(db_object);
    this.base = uploaded;
  }

  public abstract delete(relation_only?: boolean): Promise<void>;
  public abstract export(requestor?: ID): Promise<T|Export>;
  public abstract extract(): Promise<T|Export>;
  public abstract load(relations: object): Promise<void>;
  public abstract update(changes: Partial<Export>): Promise<void>;

  public abstract save(): Promise<void>;

  constructor(id: ID, base?: T) {
    this._id = id;

    if (base) {
      this.base = base;
    }
  }

  public async handleCommand(command: CommandType, model: BaseModel<DbObject>, payload?: any) {
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
    }
  }
}
