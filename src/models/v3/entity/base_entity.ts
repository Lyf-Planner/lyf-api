import { RootEntity } from '../../../api/schema';
import { BaseModel } from '../base_model';

export abstract class BaseEntity<T extends RootEntity> extends BaseModel<T> {}
