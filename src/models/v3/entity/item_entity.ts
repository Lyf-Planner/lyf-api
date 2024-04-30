import { ItemDbObject } from '../../../api/schema/database/items';
import { UserID } from '../../../api/schema/database/user';
import { Item, ItemRelatedUser, ItemRelations } from '../../../api/schema/items';
import { Logger } from '../../../utils/logging';
import { BaseEntity } from './base_entity';

export class ItemEntity extends BaseEntity<Item> {
  private logger = Logger.of(ItemEntity);

  constructor(entity: Item, requested_by: UserID) {
    super(entity, requested_by);
  }

  public id() {
    return this.entity.id;
  }

  protected parse(dbObject: ItemDbObject) {
    const initialRelations: ItemRelations = {
      users: [] as ItemRelatedUser[],
      template: undefined
    };

    return {
      ...dbObject,
      ...initialRelations
    };
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

  public includeRelations(relations: Partial<ItemRelations>) {
    this.update(relations);
  }

  export(): Item {
    return this.entity;
  }

  // Worth noting Routines and Templates refer to the same thing!
  isRoutine() {
    return this.entity.day && !this.entity.date && !this.entity.template_id;
  }
}
