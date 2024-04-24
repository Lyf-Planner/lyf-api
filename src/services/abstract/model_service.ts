import { Entity } from '../../api/schema';
import { UserID } from '../../api/schema/database/user';
import { BaseModel } from '../../models/base_model';
import { BaseRepository } from '../../repository/base_repository';
import { BaseService } from './base_service';

export abstract class ModelService<T extends Entity, K extends BaseModel<T>> extends BaseService {
  protected abstract repository: BaseRepository<T>;
  protected abstract modelFactory: (entity: T, requested_by: UserID) => K;

  public async createNew(entity: T, from: UserID): Promise<K> {
    const newEntity = await this.repository.create(entity);
    const newModel = this.modelFactory(newEntity, from);
    return newModel;
  }

  public async createNewEntity(entity: T): Promise<T> {
    const newEntity = await this.repository.create(entity);
    return newEntity;
  }
}
