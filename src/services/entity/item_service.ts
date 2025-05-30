import { v4 as uuid } from 'uuid';

import { ID } from '#/database/abstract';
import { ItemDbObject, ItemStatus, ItemType } from '#/database/items';
import { ItemUserRelationshipDbObject, Permission } from '#/database/items_on_users';
import { UserRelatedItem } from '#/user';
import { ItemEntity } from '@/models/entity/item_entity';
import { UserEntity } from '@/models/entity/user_entity';
import { ItemUserRelation } from '@/models/relation/item_related_user';
import { UserItemRelation } from '@/models/relation/user_related_item';
import { SocialItemNotifications } from '@/modules/notification_scheduling/item_notifications';
import reminderService from '@/modules/notification_scheduling/reminder_service';
import { EntityService } from '@/services/entity/_entity_service';
import { UserService } from '@/services/entity/user_service';
import { formatDateData, getStartOfCurrentWeek } from '@/utils/dates';
import { Logger } from '@/utils/logging';
import { LyfError } from '@/utils/lyf_error';

export class ItemService extends EntityService {
  protected logger = Logger.of(ItemService.name);

  async getEntity(item_id: ID, include?: string) {
    const item = new ItemEntity(item_id);
    await item.load();
    await item.fetchRelations(include);

    return item;
  }

  async getTimetable(user_id: ID, start_date: string) {
    // Validate the requestor has permission - must be themselves or a Best Friend
    const user = await new UserService().getEntity(user_id, '');

    await user.fetchItemsInFuture(start_date);
    const timetableItems = user.getRelations().items || [];
    const exportedTimetable = [];

    for (const item of timetableItems) {
      exportedTimetable.push(await item.export())
    }

    return exportedTimetable;
  }

  async processCreation(
    item_input: UserRelatedItem,
    user_id: ID,
    sorting_rank: number
  ) {
    // Create the item, as well as any user relations and note relations
    const item = new ItemEntity(item_input.id);
    try {
      await item.create(item_input, ItemEntity.filter);
    } catch {
      this.logger.warn(`Item ${item_input.id} already exists, updating`);
      return await this.processUpdate(item_input.id, item_input, user_id);
    }

    // Need to ensure we attach routine users if it has a template_id!
    if (item.templateId()) {
      const templateItem = new ItemEntity(item.templateId() as string);
      await templateItem.fetchRelations('users');
      await templateItem.load();

      const usersOnTemplate = templateItem.getRelations().users as ItemUserRelation[];

      // The creator should be a routine user
      if (!usersOnTemplate.map((x) => x.entityId()).includes(user_id)) {
        throw new LyfError('User does not have permission to create an instance of this routine', 403);
      }

      for (const itemUser of usersOnTemplate) {
        await this.copyTemplateRelationship(itemUser.getRelatedEntity(), item, templateItem);
      }
    } else if (!item.noteId()) {
      // Otherwise just attach the creator
      const ownerRelationship = new ItemUserRelation(item.id(), user_id);
      const ownerRelationshipObject = this.defaultOwnerRelationship(item.id(), user_id, sorting_rank);
      await ownerRelationship.create(ownerRelationshipObject, ItemUserRelation.filter);
    }

    await item.fetchRelations();
    await item.load();
    return item;
  }

  async processDeletion(item_id: string, from_id: string) {
    const item = new ItemEntity(item_id);
    await item.fetchRelations();
    await item.load();

    const itemUsers = item.getRelations().users as ItemUserRelation[];
    const itemDeleter = itemUsers.find((x) => x.entityId() === from_id);

    if (itemDeleter && itemDeleter.permission() === Permission.Owner || item.noteId()) {
      await item.delete(item.isRoutine());
    } else {
      throw new LyfError('Items can only be deleted by their owner', 403);
    }
  }

  async processUpdate(id: ID, changes: Partial<UserRelatedItem>, from: ID) {
    this.logger.info(`Processing changeset ${JSON.stringify(changes)} on item ${id}`);

    const itemRelation = new UserItemRelation(from, id);
    await itemRelation.load();

    const requestor = new UserEntity(from);
    await requestor.load();

    // SAFETY CHECKS
    if (!this.canUpdate(itemRelation) && !itemRelation.getRelatedEntity().noteId()) {
      throw new LyfError('User does not have permission to update item', 403);
    }

    await itemRelation.update(changes);

    // PRE-COMMIT TASKS
    // 1. Action any notification updates
    await this.handleNotificationChanges(changes, itemRelation.getRelatedEntity(), requestor);

    // 2. Handle any time changes
    await this.handleTimeChanges(changes, itemRelation.getRelatedEntity(), requestor);

    // 3. Handle any status changes
    await this.handleStatusChanges(changes, itemRelation.getRelatedEntity(), requestor);

    this.logger.debug(`User ${from} safely updated item ${id}`);

    await itemRelation.save();
    await itemRelation.getRelatedEntity().save();
    return itemRelation;
  }

  public async createUserIntroItems(user: UserEntity, tz: string) {
    const creationDate = new Date();

    const userIntroItem: ItemDbObject = {
      created: creationDate,
      last_updated: creationDate,
      id: uuid(),
      collaborative: false,
      title: 'Swipe Me Left!',
      tz,
      note_id: undefined,
      template_id: undefined,
      type: ItemType.Event,
      status: ItemStatus.Upcoming,
      date: formatDateData(getStartOfCurrentWeek(tz)),
      day: undefined,
      time: undefined,
      end_time: undefined,
      desc: 'Tap the leaf icon in the top corner for guides and tips on getting started.\n\nLet\'s setup your timetable!',
      url: undefined,
      location: undefined
    };

    const introItem = new ItemEntity(userIntroItem.id);
    await introItem.create(userIntroItem, ItemEntity.filter);

    const introRelationship = new ItemUserRelation(userIntroItem.id, user.id());
    const introRelationshipObject = this.defaultOwnerRelationship(userIntroItem.id, user.id(), 0);
    await introRelationship.create(introRelationshipObject, ItemUserRelation.filter);

    const userTimetableItem: ItemDbObject = {
      created: creationDate,
      last_updated: creationDate,
      id: uuid(),
      collaborative: false,
      title: 'Setup My Lyf Timetable',
      note_id: undefined,
      template_id: undefined,
      tz,
      type: ItemType.Task,
      status: ItemStatus.Upcoming,
      date: formatDateData(getStartOfCurrentWeek(tz)),
      day: undefined,
      time: undefined,
      end_time: undefined,
      desc: '- Open my Routine, enter everything I do each week\n- Move back to my Calendar\n- Add all the events I have planned, and any tasks I need to do\n  - If unsure on a date, add to Upcoming Events or To Do List',
      url: undefined,
      location: undefined
    };

    const timetableItem = new ItemEntity(userIntroItem.id);
    await timetableItem.create(userTimetableItem, ItemEntity.filter);

    const timetableRelationship = new ItemUserRelation(userTimetableItem.id, user.id());
    const timetableRelationshipObject = this.defaultOwnerRelationship(userTimetableItem.id, user.id(), 0);
    await timetableRelationship.create(timetableRelationshipObject, ItemUserRelation.filter);
  }

  private async canUpdate(item: UserItemRelation) {
    // Access is implied by existence of relation
    if (item.permission() === Permission.ReadOnly) {
      return false;
    }

    return true;
  }

  private async copyTemplateRelationship(user: UserEntity, item: ItemEntity, template: ItemEntity) {
    const existingRelationship = new ItemUserRelation(template.id(), user.id());
    await existingRelationship.load();

    const rawObject = existingRelationship.extractRelation();
    rawObject.item_id_fk = item.id();

    const newRelationship = new ItemUserRelation(item.id(), user.id());
    await newRelationship.create(rawObject, ItemUserRelation.filter);
  }

  private defaultOwnerRelationship(item_id: ID, user_id: ID, rank?: number): ItemUserRelationshipDbObject {
    return {
      user_id_fk: user_id,
      item_id_fk: item_id,
      created: new Date(),
      last_updated: new Date(),
      invite_pending: false,
      permission: Permission.Owner,
      sorting_rank: rank || 0,
      show_in_upcoming: undefined,
      notification_mins: undefined
    };
  }

  private async handleNotificationChanges(changes: Partial<UserRelatedItem>, item: ItemEntity, user: UserEntity) {
    if (changes.notification_mins) {
      this.logger.debug('Handling notification changes to item');
      await reminderService.updateEventNotification(item, user, changes.notification_mins);
    }
  }

  private async handleTimeChanges(changes: Partial<UserRelatedItem>, item: ItemEntity, user: UserEntity) {
    const timeChangesDetected = changes.time || changes.date;

    // Update when notifications should send
    if (timeChangesDetected) {
      this.logger.debug('Handling time changes to item');
      // Case: date or time was deleted
      if (changes.time === null || changes.date === null) {
        await this.removeAllNotifications(item);
      } else {
        await this.updateAllNotifications(item);
      }
    }

    // Notify any other users of a change!
    if (changes.time) {
      await SocialItemNotifications.handleTimeChange(user, item);
    }
    if (changes.date) {
      await SocialItemNotifications.handleDateChange(user, item);
    }
  }

  private async handleStatusChanges(changes: Partial<UserRelatedItem>, item: ItemEntity, from: UserEntity) {
    const statusChanged = changes.status;

    // Notify any other users of a change!
    if (statusChanged) {
      this.logger.debug('Handling status change to item');
      await SocialItemNotifications.handleStatusChange(from, item);
    }
  }

  private async removeAllNotifications(item: ItemEntity) {
    await item.fetchRelations('users');
    const users = item.getRelations().users as ItemUserRelation[];

    const service = reminderService;
    const updateFunc = item.isRoutine() ? service.removeRoutineNotification : service.removeEventNotification;

    for (const user of users) {
      const notificationMins = user.notificationMinsBefore();

      if (notificationMins) {
        await updateFunc(item, user.getRelatedEntity() as UserEntity);
      }
    }
  }

  private async updateAllNotifications(item: ItemEntity) {
    await item.fetchRelations('users');
    const users = item.getRelations().users as ItemUserRelation[];

    const updateFunc = item.isRoutine() ? reminderService.updateRoutineNotification : reminderService.updateEventNotification;

    for (const user of users) {
      const notificationMins = user.notificationMinsBefore();

      if (notificationMins) {
        await updateFunc(item, user.getRelatedEntity() as UserEntity, notificationMins);
      }
    }
  }
}
