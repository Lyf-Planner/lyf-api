import { DbObject } from '../../api/schema/database';
import { UserID } from '../../api/schema/database/user';

export abstract class BaseModel<T> {
  protected entity: T;
  protected requestedBy: UserID;

  constructor(object: DbObject, requested_by: UserID, validate = true) {
    this.entity = this.parse(object);
    this.requestedBy = requested_by;

    if (validate) {
      this.validate();
    }
  }

  public get() {
    return this.entity;
  }

  // All models parse the submitted db type to the internally used API type, and validate.
  // Note that relations are assumed to already be parsed
  protected abstract parse(db_object: DbObject, relation_db_object?: DbObject): T;

  public validate() {}
  public export(): any {
    return this.entity;
  }

  public update(changes: Partial<T>, validate = true) {
    const updatedContent = { ...this.entity, ...changes };

    this.entity = updatedContent;

    if (validate) {
      this.validate();
    }
  }
}
