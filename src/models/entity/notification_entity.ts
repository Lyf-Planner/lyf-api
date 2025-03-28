import { ID } from '../../../schema/database/abstract';
import { NotificationDbObject } from '../../../schema/database/notifications';
import { Notification } from '../../../schema/notifications';
import { NotificationRepository } from '../../repository/entity/notification_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { ObjectUtils } from '../../utils/object';
import { Extension } from '../../utils/types';

import { BaseEntity } from './_base_entity';
import { UserEntity } from './user_entity';

export type NotificationModelRelations = {
  to: UserEntity[];
};

export class NotificationEntity extends BaseEntity<NotificationDbObject> {
  protected logger = Logger.of(NotificationEntity.name);
  protected repository = new NotificationRepository();

  protected relations: Partial<NotificationModelRelations> = {};

  static filter(object: Extension<NotificationDbObject>): NotificationDbObject {
    const objectFilter: NotificationDbObject = {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      to: object.to,
      from: object.from,
      title: object.title,
      message: object.message,
      type: object.type,
      related_data: object.related_data,
      related_id: object.related_id,
      seen: object.seen,
      received: object.received
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  public async export(requestor?: ID, with_relations: boolean = true): Promise<Notification|NotificationDbObject> {
    if (requestor && requestor !== this.base!.to) {
      throw new LyfError('User tried to load a notification they should not have access to', 401);
    }

    return this.base!;
  }

  public async update(changes: Partial<NotificationDbObject>): Promise<void> {
    const updatedBase = NotificationEntity.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  public async fetchRelations(include?: string | undefined): Promise<void> {
    // Fetching users from a notification makes no sense - it is the leaf of a tree
  }

  public getRelations() {
    // No implementation
  }

  to() {
    return this.base!.to;
  }
}
