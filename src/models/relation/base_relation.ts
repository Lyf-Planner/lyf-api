import { Relation } from '../../api/schema';
import { DbObject } from '../../api/schema/database';
import { BaseModel } from '../base_model';

export abstract class BaseRelation<T extends Relation> extends BaseModel<T> {
  protected abstract parseRelation(relation_db_object: DbObject): Partial<DbObject>;
  protected abstract parseBase(base_db_object: DbObject): Partial<DbObject>;

  protected abstract parse(base_db_object: DbObject, relation_db_object: DbObject): T;
}
