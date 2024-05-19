import { v4 as uuid } from 'uuid';

import { ID } from '../../api/schema/database/abstract';
import { ItemDbObject, ItemStatus, ItemType } from '../../api/schema/database/items';
import { Item, ItemRelatedUser } from '../../api/schema/items';
import { ItemEntity } from '../../models/v3/entity/item_entity';
import { UserEntity } from '../../models/v3/entity/user_entity';
import { UserItemRelation } from '../../models/v3/relation/user_related_item';
import { ItemRepository } from '../../repository/entity/item_repository';
import { formatDateData } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { EntityService } from './_entity_service';
import { ItemUserRelation } from '../../models/v3/relation/item_related_user';
import { ItemUserPermission, ItemUserRelationshipDbObject } from '../../api/schema/database/items_on_users';
import { NoteItemRelation } from '../../models/v3/relation/note_related_item';
import { ItemNoteRelationshipDbObject } from '../../api/schema/database/items_on_notes';
import { LyfError } from '../../utils/lyf_error';

export class ItemService extends EntityService<ItemDbObject> {
  protected repository: ItemRepository;
  private logger = Logger.of(ItemService);

  constructor() {
    super();
    this.repository = new ItemRepository();
  }

  async processCreation(
    item_input: ItemDbObject,
    user_id: ID,
    sorting_rank: number,
    note_id?: ID
  ): Promise<Item> {
    // Create the item, as well as any user relations and note relations
    const item = new ItemEntity(item_input.id);
    await item.create(item_input);

    // Need to ensure we attach routine users if it has a template_id!
    if (item.templateId()) {
      const templateItem = new ItemEntity(item.templateId() as string);
      await templateItem.fetchRelations("users");
      await templateItem.load()
      
      const usersOnTemplate = templateItem.getRelations().users as UserEntity[];

      // The creator should be a routine user
      if (!usersOnTemplate.map((x) => x.id()).includes(user_id)) {
        throw new Error('User does not have permission to create an instance of this routine');
      }

      for (const itemUser of usersOnTemplate) {
        await this.copyTemplateRelationship(itemUser, item, templateItem);
      }
    } else {
      // Otherwise just attach the creator
      const ownerRelationship = new ItemUserRelation(item.id(), user_id);
      const ownerRelationshipObject = this.defaultOwnerRelationship(item.id(), user_id, sorting_rank)
      await ownerRelationship.create(ownerRelationshipObject)
    }

    // Setup note relation if created on a note
    if (note_id) {
      await this.createOnNote(note_id, item.id());
    }

    await item.fetchRelations();
    return await item.export() as Item;
  }

  async processUpdate(id: ID, changes: Partial<Item>, from: ID) {
    const item = new ItemEntity(id);
    await item.load();

    if (!this.canUpdate(item, from)) {
      throw new LyfError('User does not have permission to update item', 403);
    }

    await item.update(changes);

    // PRE-COMMIT (update other items like notifications)
    this.checkDailyNotifications(user, changes);
    this.checkTimezoneChange(user, changes);

    this.logger.debug(`User ${id} safely updated their own data`);

    await user.save();
    return user;
  }

  public async retrieveForUser(user_id: ID, requestor_id: ID, include?: string): Promise<UserEntity> {
    const user = new UserEntity(user_id);
    await user.fetchRelations(include);
    await user.load();
    
    return user;
  }

  async retrieveManyUsers(user_ids: ID[], requestor: ID) {
    const repo = new UserRepository();
    const rawUsers = await repo.findManyByUserId(user_ids);
    const exportedUsers = rawUsers
      .filter((x) => !x.private)
      .map((x) => {
        const user = new UserEntity(x.id, x);
        return user.export(requestor)
      });

    return exportedUsers;
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

  private async canUpdate(item: ItemEntity, user_id: ID) {
    await item.fetchRelations("users");
    const itemExport = await item.export() as Item
    const users = itemExport.relations.users;

    const relevantUser = users?.find((x) => x.id === user_id);

    if (!relevantUser || relevantUser.permission === ItemUserPermission.ReadOnly) {
      return false;
    }

    return true;
  }

  private async copyTemplateRelationship(user: UserEntity, item: ItemEntity, template: ItemEntity) {
    const existingRelationship = new ItemUserRelation(template.id(), user.id())
    await existingRelationship.load();

    const rawObject = existingRelationship.extractRelation();
    rawObject.item_id_fk = item.id();

    const newRelationship = new ItemUserRelation(item.id(), user.id());
    await newRelationship.create(rawObject);
  }

  private async createOnNote(note_id: ID, item_id: ID) {
    const relationship = new NoteItemRelation(note_id, item_id);
    const object: ItemNoteRelationshipDbObject = {
      item_id_fk: item_id,
      note_id_fk: note_id,
      created: new Date(),
      last_updated: new Date()
    }

    await relationship.create(object);
  }

  private defaultOwnerRelationship(item_id: ID, user_id: ID, rank?: number): ItemUserRelationshipDbObject {
    return {
      user_id_fk: user_id,
      item_id_fk: item_id,
      created: new Date(),
      last_updated: new Date(),
      invite_pending: false,
      permission: ItemUserPermission.Owner,
      sorting_rank: rank || 0
    }
  }

  private handleTimeChanges(proposed: ListItem, from: UserModel) {
    const timeChanged = proposed.time !== this.content.time;
    const dateChanged = proposed.date !== this.content.date;
    const changes = timeChanged || dateChanged;

    // Update when notifications should send
    if (changes && this.content.notifications) {
      for (const notification of this.content.notifications) {
        // Case: date or time was deleted
        if (!proposed.time || !proposed.date) {
          notificationManager.removeEventNotification(proposed, notification.user_id);
          continue;
        }

        // Otherwise update them all
        var oldNotif =
          this.content.notifications &&
          this.content.notifications.find((x) => x.user_id === notification.user_id);
        if (!oldNotif) {
          notificationManager.setEventNotification(proposed, notification.user_id);
        } else {
          notificationManager.updateEventNotification(proposed, notification.user_id);
        }
      }

      // Notify any other users of a change!
      if (timeChanged) {
        SocialItemNotifications.timeChanged(from, proposed);
      }
      if (dateChanged) {
        SocialItemNotifications.dateChanged(from, proposed);
      }
    }
  }

  private handleStatusChanges(proposed: ListItem, from: UserModel) {
    const statusChanged = proposed.status !== this.content.status;
    const statusChangeRelevant =
      proposed.status === ItemStatus.Done || proposed.status === ItemStatus.Cancelled;

    // Notify any other users of a change!
    if (statusChanged && statusChangeRelevant) {
      SocialItemNotifications.statusChanged(from, proposed);
    }
  }
}
