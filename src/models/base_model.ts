import { Model } from '../api/schema/models';
import { Export } from '../api/schema/serialized';
import { User } from '../api/schema/user';

export abstract class BaseModel<T extends Model> {
  protected entity: T;
  protected requestedBy: User;

  constructor(entity: T, requestor: User, validate = true) {
    this.entity = entity;
    this.requestedBy = requestor;
    this.validate();
  }

  public async includeRelations() {}

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

  public export(): Model {
    return this.entity;
  }
}
