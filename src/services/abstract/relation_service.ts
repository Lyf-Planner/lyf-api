import { DbObject } from '../../api/schema/database';
import { BaseRepository } from '../../repository/base_repository';
import { BaseService } from './base_service';

export abstract class RelationService<T extends DbObject> extends BaseService<T> {
  protected abstract repository: BaseRepository<DbObject>;
}
