import { DbObject } from '#/database';
import { ID } from '#/database/abstract';
import { Export } from '#/index';
import { BaseRepository } from '@/repository/_base_repository';
import { Logger } from '@/utils/logging';
import { LyfError } from '@/utils/lyf_error';
import { Includes } from '@/utils/types';

export enum CommandType {
  Delete,
  Export,
  Extract,
  Load,
  Save,
  Update
}

export abstract class BaseModel<T extends DbObject> {
  protected _id: ID;

  protected base?: T;
  protected changes: Partial<T> = {};

  protected abstract logger: Logger;
  protected abstract repository: BaseRepository<T>;

  public id() {
    return this._id;
  }

  public async create(db_object: T, filter: (object: Includes<T>) => T) {
    if (filter) {
      db_object = filter(db_object);
    }

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

  public async handleCommand(command: CommandType, model: BaseModel<DbObject>, payload?: unknown) {
    switch (command) {
      case CommandType.Delete:
        return await model.delete();
      case CommandType.Export:
        if (payload && typeof payload !== 'string') {
          throw new LyfError('type of payload should be string for export', 500);
        }
        return await model.export(payload as string | undefined);
      case CommandType.Extract:
        return await model.extract();
      case CommandType.Load:
        if (payload && typeof payload !== 'object') {
          throw new LyfError('type of payload should be object for load', 500);
        }
        return await model.load(payload as object);
      case CommandType.Save:
        return await model.save();
      case CommandType.Update:
        if (payload && typeof payload !== 'object') {
          throw new LyfError('type of payload should be string for export', 500);
        }
        return await model.update(payload as object);
    }
  }

  public hasBase() {
    return !!this.base;
  }
}
