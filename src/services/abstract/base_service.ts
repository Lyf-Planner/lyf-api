import { DbObject } from '../../api/schema/database';
import { BaseRepository } from '../../repository/base_repository';

export abstract class BaseService<T extends DbObject> {
  protected abstract repository: BaseRepository<DbObject>;

  public async createNewDbObject(entity: T): Promise<T> {
    const newDbObject = (await this.repository.create(entity)) as T;
    return newDbObject;
  }
}
