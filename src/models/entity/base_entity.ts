import { Entity } from '../../api/schema';
import { ID } from '../../api/schema/database/abstract';
import { UserID } from '../../api/schema/database/user';
import { BaseModel } from '../base_model';

export abstract class BaseEntity<T extends Entity> extends BaseModel<T> {
  // These are used in preference over `update` method for type safety on relational changes
  public abstract includeRelations(...args: any[]): void;
  public abstract id(): ID | UserID;
}
