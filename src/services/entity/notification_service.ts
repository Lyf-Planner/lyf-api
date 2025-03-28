import { ID } from '../../../schema/database/abstract';
import { NotificationDbObject } from '../../../schema/database/notifications';
import { Notification } from '../../../schema/notifications';
import { NotificationEntity } from '../../models/entity/notification_entity';
import { UserEntity } from '../../models/entity/user_entity';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';

import { EntityService } from './_entity_service';

export class NotificationService extends EntityService {
  protected logger = Logger.of(NotificationService.name);

  async getUserNotifications(to: ID, limit?: number) {
    const user = new UserEntity(to)
    await user.fetchRelations('notifications', limit)

    const { notifications } = user.getRelations()
    if (!notifications) {
      return [];
    }

    const exported = [];
    for (const notification of notifications) {
      exported.push(await notification.export());
    }

    return exported;
  }

  async processCreation(notification_input: NotificationDbObject) {
    const notification = new NotificationEntity(notification_input.id);
    await notification.create(notification_input, NotificationEntity.filter);

    return notification;
  }

  async processDeletion(notification_id: string, from_id: string) {
    // No implementation
  }

  async processUpdate(id: ID, changes: Partial<Notification>, from: ID) {
    const notification = new NotificationEntity(id);
    await notification.load();

    // SAFETY CHECKS
    if (notification.to() !== from) {
      throw new LyfError('Tried to update a notification not addressed to you', 403);
    }

    await notification.update(changes);
    await notification.save();
    return notification;
  }
}
