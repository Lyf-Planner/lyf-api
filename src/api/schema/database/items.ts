import { DbEntry, ID } from './abstract';

// Notes:
// - primary key: id
// - foreign key: template_id (items.id)
// - title has limit of 80 chars
// - date is indexed (desc)

export interface ItemDbObject extends DbEntry {
  title: string;
  type: ItemType;
  status: ItemStatus;
  tz: string;
  date?: string; // yyyy-mm-dd
  day?: string;
  desc?: string;
  time?: string; // hh:mm
  end_time?: string; // hh:mm
  template_id?: ID;
  url?: string;
  location?: string;
  show_in_upcoming?: boolean;
  notification_mins_before?: number;
}

export interface ItemSensitiveFields {}

// Enums

export enum ItemType {
  Event = 'Event',
  Task = 'Task'
}

export enum ItemStatus {
  Cancelled = 'Cancelled',
  Tentative = 'Tentative',
  Upcoming = 'Upcoming',
  InProgress = 'In Progress',
  Done = 'Done'
}
