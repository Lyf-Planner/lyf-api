import { Entity } from '../../api/schema';
import { DbEntityObject, DbObject } from '../../api/schema/database';
import { BaseModel } from '../../models/v3/base_model';
import { BaseRepository } from '../../repository/_base_repository';
import { Logger } from '../../utils/logging';

export abstract class BaseService<T extends Entity> {
  protected abstract logger: Logger
  
  public abstract processCreation(...args: any[]): Promise<T>;
  public abstract processUpdate(...args: any[]): Promise<T>;
}
