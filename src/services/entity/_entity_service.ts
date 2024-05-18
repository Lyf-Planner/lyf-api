import { Entity } from '../../api/schema';
import { DbEntityObject, DbObject } from '../../api/schema/database';
import { BaseService } from '../_base_service';

export abstract class EntityService<T extends DbEntityObject> extends BaseService {
    
  public abstract processCreation(...args: any[]): Promise<any>;
  public abstract processUpdate(...args: any[]): Promise<Entity>;
}
