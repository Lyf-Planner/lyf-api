import { Entity } from '../../api/schema';
import { BaseModel } from '../base_model';

export abstract class BaseEntity<T extends Entity> extends BaseModel<T> {
    // These are used in preference over `update` method for type safety on relational changes
    public abstract includeRelations(...args: any[]): void;
}
