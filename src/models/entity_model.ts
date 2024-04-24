import { Entity } from '../api/schema';
import { BaseModel } from './base_model';

export abstract class EntityModel<T extends Entity> extends BaseModel<T> {}
