import { DayOfWeek, TimeString, DateString } from '../util/dates';
import { DbEntry, ID } from './abstract';

// Notes:
// - primary key: id
// - foreign key: template_id (items.id)
// - title has limit of 80 chars
// - date is indexed (desc) and has 10 chars

export interface ItemDbObject extends DbEntry {
  title: string;
  type: ItemType;
  status: ItemStatus;
  tz: string;

  // This indicates whether the item uses the user permissions table - when false, Owner permission is implied.
  // Provides a huge optimisation timetable queries and massively reduces data for notes.
  collaborative: boolean;

  // References
  note_id: ID | undefined;
  template_id: ID | undefined;

  date: DateString | undefined; // yyyy-mm-dd
  day: string | undefined;
  desc: string | undefined;
  time: TimeString | undefined; // hh:mm
  end_time: TimeString | undefined; // hh:mm
  url: string | undefined;
  location: string | undefined;

  // Fields with user preference overrides in User-Item relation
  default_sorting_rank?: number;
  default_show_in_upcoming?: boolean;
  default_notification_mins?: number;
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
