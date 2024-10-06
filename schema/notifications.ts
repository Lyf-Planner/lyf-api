import { NotificationDbObject } from './database/notifications';

export interface NotificationRelations {}

export interface Notification extends NotificationDbObject {
  relations: Partial<NotificationRelations>;
}
