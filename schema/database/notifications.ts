import { DbEntry, ID } from './abstract';

// Notes:
// - primary key: id
// - foreign key: to (users.id)
// - foreign key: from (users.id)

export interface NotificationDbObject extends DbEntry {
  to: ID;
  from: ID | undefined;
  title: string;
  message: string;
  type: NotificationType;
  related_data?: NotificationRelatedData;
  related_id?: ID;
  seen: boolean;
  received: boolean;
}

// Enums

export enum NotificationType {
  ItemReminder = 'ItemReminder',
  ItemSocial = 'ItemSocial',
  UserSocial = 'UserSocial',
  NoteSocial = 'NoteSocial',
}

export enum NotificationRelatedData {
  Item = 'Item',
  User = 'User',
  Note = 'Note',
}