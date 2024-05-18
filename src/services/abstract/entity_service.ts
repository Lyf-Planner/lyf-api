import { DbEntityObject, DbObject } from '../../api/schema/database';
import { BaseService } from './base_service';

export abstract class EntityService<T extends DbEntityObject> extends BaseService<T> {
}
