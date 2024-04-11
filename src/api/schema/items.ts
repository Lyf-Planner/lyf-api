import { DbObject } from './abstract';
import { ItemNoteRelationship } from './items_on_notes';
import { ItemUserRelationshipDbObject } from './items_on_users';

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

export interface ItemDbObject extends DbObject {
  title: string;
  type: ItemType;
  status: ItemStatus;
  tz: string;
  date?: string;
  day?: string; // For templates
  desc?: string;
  time?: string;
  end_time?: string;
  template_id?: string;
  url?: string;
  location?: string;
  show_in_upcoming?: boolean;
  notification_mins_before?: string;
};

export interface Item extends ItemDbObject {
  // Note linking
  notes: ItemNoteRelationship[];
  // Access
  users: ItemUserRelationshipDbObject[];
};
