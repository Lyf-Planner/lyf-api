import { DbObject, ID } from './abstract';
import { ItemNoteRelationship } from './items_on_notes';
import { ItemUserRelationshipDbObject } from './items_on_users';

// Notes:
// - primary key: id
// - foreign key: template_id (items.id)
// - title has limit of 80 chars
// - date is indexed (desc)

export interface ItemDbObject extends DbObject {
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

export interface Item extends ItemDbObject {
  notes: ItemNoteRelationship[];
  users: ItemUserRelationshipDbObject[];
}

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
