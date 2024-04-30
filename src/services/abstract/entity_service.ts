import { Entity } from '../../api/schema';
import { DbObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { UserID } from '../../api/schema/database/user';
import { BaseEntity } from '../../models/v3/entity/base_entity';
import { BaseRepository } from '../../repository/base_repository';
import { BaseService } from './base_service';

export abstract class EntityService<
  T extends DbObject,
  K extends BaseEntity<Entity>
> extends BaseService<T> {
  protected abstract modelFactory: (entity: T, requested_by: UserID) => K;

  public async createNew(db_object: T, from: UserID): Promise<K> {
    const newEntity = (await this.repository.create(db_object)) as T;
    const newModel = this.modelFactory(newEntity, from);
    return newModel;
  }

  public abstract safeUpdate(id: ID | UserID, changes: Partial<Entity>): void;

  public async commit(entity: K, changes: Partial<Entity>) {
    // Updating the entity will ensure changes get validated
    entity.update(changes);
    // Kysely ignores fields not included on a table when saving, so including relations is fine
    await this.repository.update(entity.id(), changes);
  }
}
