import { v4 as uuid } from 'uuid';

import { ID } from '../api/schema/database/abstract';
import { ItemDbObject, ItemStatus, ItemType } from '../api/schema/database/items';
import { Item } from '../api/schema/items';
import { UserID } from '../api/schema/database/user';
import { ItemModel } from '../models/item_model';
import { ItemRepository } from '../repository/item_repository';
import { formatDateData } from '../utils/dates';
import { Logger } from '../utils/logging';
import { ItemNoteService } from './item_note_service';
import { ItemUserService } from './item_user_service';
import { ModelService } from './abstract/model_service';

export class ItemService extends ModelService<Item, ItemModel> {
  protected repository: ItemRepository;
  private logger = Logger.of(ItemService);
  protected modelFactory = (item: Item, requested_by: UserID) => new ItemModel(item, requested_by);

  constructor() {
    super();
    this.repository = new ItemRepository();
  }

  public async initialise(
    item_input: ItemDbObject,
    user_id: UserID,
    sorting_rank: number,
    note_id?: ID
  ): Promise<ItemModel> {
    // Create the item, as well as any user relations and note relations
    const item = await this.createNew(item_input, user_id);
    const itemEntity = item.export();

    // Need to ensure we attach routine users if it has a template_id!
    if (itemEntity.template_id) {
      const itemUserService = new ItemUserService();
      const usersOnTemplate = await itemUserService.getUserRelationsOnItem(itemEntity.template_id);

      // The creator should be a routine user
      if (!usersOnTemplate.map((x) => x.user_id_fk).includes(user_id)) {
        throw new Error('User does not have permission to create an instance of this routine');
      }

      for (const itemUserRelationship of usersOnTemplate) {
        await itemUserService.copyRoutineRelationship(itemEntity.id, itemUserRelationship);
      }
    } else {
      // Otherwise just attach the creator
      await new ItemUserService().initialiseItemOwner(item.export().id, user_id, sorting_rank);
    }

    // Setup note relation if created on a note
    if (note_id) {
      await new ItemNoteService().initialiseItemOnNote(item.export().id, note_id);
    }

    return item;
  }

  public async createUserIntroItem(user_id: UserID, tz: string) {
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

    return this.initialise(userIntroItem, user_id, 0);
  }
}
