import { Relation } from '../../../api/schema';
import { DbObject } from '../../../api/schema/database';
import { UserID } from '../../../api/schema/database/user';
import { BaseModel } from '../base_model';

export abstract class BaseRelation<T extends Relation> extends BaseModel<T> {
  constructor(combined_db_object: DbObject, requested_by: UserID) {
    super(combined_db_object, requested_by);
    this.entity = this.parse(combined_db_object);
  }

  protected abstract parse(combined_db_object: DbObject & DbObject): T;
}
