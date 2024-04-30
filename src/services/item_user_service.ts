import { ID } from '../api/schema/database/abstract';
import {
  ItemUserPermission,
  ItemUserRelationshipDbObject
} from '../api/schema/database/items_on_users';
import { UserID } from '../api/schema/database/user';
import { ItemEntity } from '../models/v3/entity/item_entity';
import { UserEntity } from '../models/v3/entity/user_entity';
import { ItemUserRelation } from '../models/v3/relation/item_related_user';
import { UserItemRelation } from '../models/v3/relation/user_related_item';
import { ItemUserRepository } from '../repository/item_user_repository';
import { Logger } from '../utils/logging';
import { RelationService } from './abstract/relation_service';

export class ItemUserService extends RelationService<ItemUserRelationshipDbObject> {
  protected repository: ItemUserRepository;
  private logger = Logger.of(ItemUserService);

  constructor() {
    super();
    this.repository = new ItemUserRepository();
  }

  public async update(
    user_id: UserID,
    item_id: ID,
    changes: Partial<ItemUserRelationshipDbObject>
  ) {
    await this.repository.updateRelation(user_id, item_id, changes);
  }

  // Recreates a users relationship with a routine on one of it's instances
  public async copyRoutineRelationship(
    item: ItemEntity,
    prev_relationship: ItemUserRelationshipDbObject
  ) {
    const creationDate = new Date();

    const itemUserRelationship = {
      ...prev_relationship,
      created: creationDate,
      last_updated: creationDate,
      item_id_fk: item.id()
    };

    const dbObject = await this.createNewDbObject(itemUserRelationship);
    return new ItemUserRelation({ ...item.get(), ...dbObject }, prev_relationship.user_id_fk);
  }

  public async initialiseItemOwner(item: ItemEntity, user: UserEntity, sorting_rank: number) {
    const creationDate = new Date();

    const itemUserRelationship = {
      created: creationDate,
      last_updated: creationDate,
      user_id_fk: user.id(),
      item_id_fk: item.id(),
      invite_pending: false,
      permission: ItemUserPermission.Owner,
      sorting_rank
    };

    const dbObject = await this.createNewDbObject(itemUserRelationship);
    return new UserItemRelation({ ...item.get(), ...dbObject }, user.id());
  }

  public async retrieveItemsOnUser(user_id: UserID, date?: string, day?: string) {
    let items;

    if (date && day) {
      items = await this.repository.findUserRelatedItemsOnDateOrDay(user_id, date, day);
    } else if (date) {
      items = await this.repository.findUserRelatedItemsOnDate(user_id, date);
    } else if (day) {
      items = await this.repository.findUserRelatedItemsOnDay(user_id, day);
    } else {
      items = await this.repository.findUserRelatedItems(user_id);
    }

    return items.map((x) => new UserItemRelation(x, user_id));
  }

  public async retrieveAsUserItem(item: ItemEntity, user_id: UserID) {
    const relationDbObject = await this.repository.findByCompositeId({
      item_id_fk: item.id(),
      user_id_fk: user_id
    });
    if (!relationDbObject) {
      throw new Error(`Retrieved item-user relation ${item.id()}-${user_id} was not found`);
    }

    return new UserItemRelation({ ...item.get(), ...relationDbObject }, user_id);
  }

  public async getItemRelatedUsers(item_id: ID) {
    return await this.repository.findItemRelatedUsers(item_id);
  }
}
