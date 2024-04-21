import { v4 as uuid } from 'uuid';

import { Item, ItemStatus, ItemType } from '../api/schema/items';
import { UserID } from '../api/schema/user';
import { ItemModel } from '../models/item_model';
import { ItemRepository } from '../repository/item_repository';
import { formatDateData } from '../utils/dates';
import { Logger } from '../utils/logging';
import { BaseService } from './base_service';

export class ItemService extends BaseService {
  private logger = Logger.of(ItemService);
  private repository: ItemRepository;

  constructor(item_repository: ItemRepository) {
    super();
    this.repository = item_repository;
  }

  public async createNew(item: Item|undefined, with_owner_relation = true) {

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

    return this.createNew(userIntroItem);
  }
}
