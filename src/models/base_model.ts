import { Entity } from '../api/schema';
import { DbEntity } from '../api/schema/database';
import { UserID } from '../api/schema/database/user';

export abstract class BaseModel<T> {
  protected entity: T;
  protected requestedBy: UserID;

  constructor(object: DbEntity, requested_by: UserID, validate = true) {
    this.entity = this.parse(object);
    this.requestedBy = requested_by;

    if (validate) {
      this.validate();
    }
  }

  // All models translate the submitted db type to the internally used API type, and validate.
  protected abstract parse<K extends DbEntity>(dbObject: K): T;
  protected abstract validate(): void;

  public update(changes: Partial<T>, validate = true) {
    const updatedContent = { ...this.entity, ...changes };

    this.entity = updatedContent;

    if (validate) {
      this.validate();
    }
  }
}
