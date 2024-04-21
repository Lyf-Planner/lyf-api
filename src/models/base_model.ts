import { Model } from '../api/schema/models';
import { User, UserID } from '../api/schema/user';

export abstract class BaseModel<T extends Model> {
  protected entity: T;
  protected requestedBy: UserID;

  constructor(entity: T, requestor: UserID, validate = true) {
    this.entity = entity;
    this.requestedBy = requestor;
    this.validate();
  }

  public includeRelations() {}
  public export() {}

  public async update(changes: Partial<T>, validate = true) {
    const updatedContent = { ...this.entity, ...changes };

    if (validate) {
      this.validate(updatedContent);
    }

    this.entity = updatedContent;
  }

  public validate(content?: T) {
    return true;
  }
}
