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
import { UserRelatedItem } from '../../api/schema/user';
import { NotificationService } from '../notifications/timetable_notifications';
import { SocialItemNotifications } from '../notifications/item_notifications';

export class ItemService extends EntityService<ItemDbObject> {
  protected repository: ItemRepository;
  protected logger = Logger.of(ItemService);

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

  async processUpdate(id: ID, changes: Partial<UserRelatedItem>, from: ID) {
    const item = new ItemEntity(id);
    await item.load();

    const requestor = new UserEntity(from)
    await requestor.load()

    if (!this.canUpdate(item, from)) {
      throw new LyfError('User does not have permission to update item', 403);
    }

    await item.update(changes);

    // SAFETY CHECKS
    // 1. Cannot update as a Viewer or Invited
    this.throwIfReadOnly(item, from);

    // PRE-COMMIT TASKS
    // 1. Action any notification updates
    this.handleNotificationChanges(changes, item, requestor);

    // 2. Handle any time changes
    this.handleTimeChanges(changes, item, requestor);

    // 3. Handle any status changes
    this.handleStatusChanges(changes, item, requestor);

    this.logger.debug(`User ${id} safely updated their own data`);

    await item.save();
    return item;
  }

  public async retrieveForUser(item_id: ID, include?: string): Promise<ItemEntity> {
    const item = new ItemEntity(item_id);
    await item.fetchRelations(include);
    await item.load();
    
    return item;
  }

  public async createUserIntroItem(user: UserEntity, tz: string) {
    const creationDate = new Date();

    const userIntroItem: ItemDbObject = {
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

    const item = new ItemEntity(userIntroItem.id);
    await item.create(userIntroItem);

    const relationship = new ItemUserRelation(userIntroItem.id, user.id());
    const relationshipObject = this.defaultOwnerRelationship(userIntroItem.id, user.id(), 0)
    await relationship.create(relationshipObject);
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

  private handleNotificationChanges(changes: Partial<UserRelatedItem>, item: ItemEntity, user: UserEntity) {
    if (changes.notification_mins_before) {
      new NotificationService().updateEventNotification(item, user, changes.notification_mins_before);
    }
  }

  private async handleTimeChanges(changes: Partial<UserRelatedItem>, item: ItemEntity, user: UserEntity) {
    const timeChangesDetected = changes.time || changes.date;

    // Update when notifications should send
    if (timeChangesDetected) {
        // Case: date or time was deleted
        if (changes.time === null || changes.date === null) {
          await this.removeAllNotifications(item)
        } else {
          await this.updateAllNotifications(item);
        }
      }

      // Notify any other users of a change!
      if (changes.time) {
        SocialItemNotifications.timeChanged(user, item);
      }
      if (changes.date) {
        SocialItemNotifications.dateChanged(user, item);
      }
    }

  private handleStatusChanges(changes: Partial<UserRelatedItem>, item: ItemEntity, from: UserEntity) {
    const statusChanged = changes.status;
    const statusChangeRelevant =
      changes.status === ItemStatus.Done || changes.status === ItemStatus.Cancelled;

    // Notify any other users of a change!
    if (statusChanged && statusChangeRelevant) {
      SocialItemNotifications.statusChanged(from, item);
    }
  }

  private async removeAllNotifications(item: ItemEntity) {
    await item.fetchRelations("users");
    const users = item.getRelations().users as ItemUserRelation[];

    const service = new NotificationService()
    const updateFunc = item.isRoutine() ? service.removeRoutineNotification : service.removeEventNotification;

    for (const user of users) {
      const notificationMins = user.hasNotification()

      if (notificationMins) {
        await updateFunc(item, user.getRelatedEntity() as UserEntity)
      }
    }
  }

  private async throwIfReadOnly(item: ItemEntity, user_id: ID) {
    await item.fetchRelations("users");
    const itemUsers = item.getRelations().users as ItemUserRelation[];

    const permitted = itemUsers.some((x) => 
      x.id() === user_id &&
      x.getPermission() !== ItemUserPermission.ReadOnly &&
      !x.isInvited()
    )

    if (!permitted) {
      throw new LyfError(`User ${user_id} does not have permission to edit item ${item.id()}`, 403);
    }
  }

  private async updateAllNotifications(item: ItemEntity) {
    await item.fetchRelations("users");
    const users = item.getRelations().users as ItemUserRelation[];

    const service = new NotificationService()
    const updateFunc = item.isRoutine() ? service.updateRoutineNotification : service.updateEventNotification;

    for (const user of users) {
      const notificationMins = user.hasNotification()

      if (notificationMins) {
        await updateFunc(item, user.getRelatedEntity() as UserEntity, notificationMins)
      }
    }
  }
}
