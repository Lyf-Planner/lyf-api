import { Relation } from '../../api/schema';
import { DbObject } from '../../api/schema/database';
import { BaseRepository } from '../../repository/_base_repository';
import { BaseService } from './base_service';

export abstract class RelationService<T extends Relation> extends BaseService<T> {
  protected abstract repository: BaseRepository<DbObject>;
}
