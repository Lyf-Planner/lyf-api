import { UserID } from '../api/schema/database/user';
import { Item } from '../api/schema/items';
import { Logger } from '../utils/logging';
import { BaseModel } from './base_model';

export class ItemModel extends BaseModel<Item> {
  private logger = Logger.of(ItemModel);

  constructor(entity: Item, requested_by: UserID) {
    super("entity", requested_by);
  }

  validate() {
    if (this.entity.users) {
      const user_ids = this.entity.users.map((x) => x.user_id);

      if (!user_ids.includes(this.requestedBy)) {
        this.logger.error(
          `User ${this.requestedBy} lost access to item ${this.entity.id} during process`
        );
        throw new Error(`User ${this.requestedBy} no longer has access to item ${this.entity.id}`);
      }
    }
  }

  export(): Item {
    return this.entity;
  }

  // Worth noting Routines and Templates refer to the same thing!
  isRoutine() {
    return this.entity.day && !this.entity.date && !this.entity.template_id;
  }
}
