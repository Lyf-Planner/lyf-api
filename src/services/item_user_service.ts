import { ID } from '../api/schema/abstract';
import {
  ItemUserPermission,
  ItemUserRelationshipDbObject
} from '../api/schema/database/items_on_users';
import { UserID } from '../api/schema/user';
import { ItemUserRelationshipModel } from '../models/item_user_model';
import { ItemUserRepository } from '../repository/item_user_repository';
import { Logger } from '../utils/logging';
import { ModelService } from './model_service';

export class ItemUserService extends ModelService<ItemUserRelationship, ItemUserRelationshipModel> {
  protected repository: ItemUserRepository;
  private logger = Logger.of(ItemUserService);
  protected modelFactory = (item_user: ItemUserRelationship) =>
    new ItemUserRelationshipModel(item_user)

  constructor() {
    super();
    this.repository = new ItemUserRepository();
  }

  // Recreates a users relationship with a routine on one of it's instances
  public async copyRoutineRelationship(
    item_id: ID,
    prev_relationship: ItemUserRelationshipDbObject
  ) {
    const creationDate = new Date();

    const itemUserRelationship = {
      ...prev_relationship,
      created: creationDate,
      last_updated: creationDate,
      item_id_fk: item_id
    };

    await this.createNew(itemUserRelationship);
  }

  public async initialiseItemOwner(item_id: ID, user_id: UserID, sorting_rank: number) {
    const creationDate = new Date();

    const itemUserRelationship = {
      created: creationDate,
      last_updated: creationDate,
      user_id_fk: user_id,
      item_id_fk: item_id,
      invite_pending: false,
      permission: ItemUserPermission.Owner,
      sorting_rank
    };

    await this.createNew(itemUserRelationship);
  }

  public async getUserRelationsOnItem(item_id: ID) {
    return await this.repository.findItemUserRelationsByItemId(item_id);
  }
}
