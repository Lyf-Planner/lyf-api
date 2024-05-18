import { v4 as uuid } from 'uuid';

import { ID } from '../api/schema/database/abstract';
import { ItemDbObject, ItemStatus, ItemType } from '../api/schema/database/items';
import { Item } from '../api/schema/items';
import { ItemEntity } from '../models/v3/entity/item_entity';
import { UserEntity } from '../models/v3/entity/user_entity';
import { UserItemRelation } from '../models/v3/relation/user_related_item';
import { ItemRepository } from '../repository/entity/item_repository';
import { formatDateData } from '../utils/dates';
import { Logger } from '../utils/logging';
import { EntityService } from './abstract/entity_service';
import { ItemNoteService } from './item_note_service';
import { ItemUserService } from './item_user_service';

export class ItemService extends EntityService<ItemDbObject> {
  protected repository: ItemRepository;
  private logger = Logger.of(ItemService);

  constructor() {
    super();
    this.repository = new ItemRepository();
  }

  public async initialise(
    item_input: ItemDbObject,
    user: UserEntity,
    sorting_rank: number,
    note_id?: ID
  ) {
    // Create the item, as well as any user relations and note relations
    const item = await this.createNew(item_input, user.id());
    const itemEntity = item.get();

    let ownerRelatedItem;
    // Need to ensure we attach routine users if it has a template_id!
    if (itemEntity.template_id) {
      const itemUserService = new ItemUserService();
      const usersOnTemplate = await itemUserService.getItemRelatedUsers(itemEntity.template_id);

      // The creator should be a routine user
      if (!usersOnTemplate.map((x) => x.user_id_fk).includes(user.id())) {
        throw new Error('User does not have permission to create an instance of this routine');
      }

      for (const itemUserRelationship of usersOnTemplate) {
        await itemUserService.copyRoutineRelationship(item, itemUserRelationship);
      }
    } else {
      // Otherwise just attach the creator
      ownerRelatedItem = await new ItemUserService().initialiseItemOwner(item, user, sorting_rank);
    }

    // Setup note relation if created on a note
    if (note_id) {
      await new ItemNoteService().initialiseItemOnNote(item, note_id);
    }

    return ownerRelatedItem;
  }

  public async retrieveForUser(item_id: ID, user_id: UserID) {
    const itemDbObject = await this.repository.findById(item_id);
    if (!itemDbObject) {
      throw new Error(`Could not retrieve item ${item_id} for user ${user_id}`);
    }

    return new ItemEntity(itemDbObject, user_id);
  }

  public async safeUpdate() {}

  public async createUserIntroItem(user: UserEntity, tz: string) {
    const creationDate = new Date();

    const userIntroItem: Item = {
      created: creationDate,
      last_updated: creationDate,
      id: uuid(),
      title: 'Swipe Me Left!',
      tz,
      type: ItemType.Event,
      status: ItemStatus.Upcoming,
      date: formatDateData(new Date()),
      day: undefined,
      desc: 'This is your first item!\nTo create another like it, type it into the desired day\nTo delete this, hold it down'
    };

    return (await this.initialise(userIntroItem, user, 0)) as UserItemRelation;
  }
}
