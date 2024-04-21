import { ItemStatus, ItemType } from '../../../src/api/schema/items';
import { ItemUserPermission } from '../../../src/api/schema/items_on_users';
import { formatDateData, getDayFromDate } from '../../../src/utils/dates';

const creationDate = new Date();

export const testDatedItemCreate = {
  title: 'testing',
  type: ItemType.Event,
  status: ItemStatus.Upcoming,
  tz: 'Australia/Melbourne',
  date: formatDateData(creationDate),
  desc: 'for testing purposes',
  time: '11:00',
  end_time: '12:00',
  url: 'https://ethanhusband.com',
  location: 'the cloud',
  show_in_upcoming: true,
  notification_mins_before: '5' // This needs to be handled in a special way
  // Excluded:
  // day
  // template_id
};

export const testDatedItemCreatorRelationship = {
  user_id: 'test_user',
  invite_pending: false,
  status: ItemUserPermission.Owner
};

export const testDatedItemExport = {
  id: expect.any(String),
  created: expect.any(Date),
  last_updated: expect.any(Date),
  title: 'testing',
  type: ItemType.Event,
  status: ItemStatus.Upcoming,
  tz: 'Australia/Melbourne',
  date: formatDateData(creationDate),
  desc: 'for testing purposes',
  time: '11:00',
  end_time: '12:00',
  url: 'https://ethanhusband.com',
  location: 'the cloud',
  show_in_upcoming: true,
  notification_mins_before: '5',
  users: [testDatedItemCreatorRelationship]
};

// Another test case

export const exampleRoutineItemGet = {
  id: 'test',
  created: expect.any(Date),
  last_updated: expect.any(Date),
  title: 'testing',
  type: ItemType.Event,
  status: ItemStatus.Upcoming,
  tz: 'Australia/Melbourne',
  day: getDayFromDate(creationDate),
  desc: 'for testing purposes',
  time: '11:00',
  end_time: '12:00',
  url: 'https://ethanhusband.com',
  location: 'the cloud',
  show_in_upcoming: true,
  notification_mins_before: '5',
  users: [
    {
      user_id: 'test_user',
      invite_pending: false,
      status: ItemUserPermission.Owner
    }
  ]
};

export const exampleRoutineItemCreate = {
  title: 'testing',
  type: ItemType.Event,
  status: ItemStatus.Upcoming,
  timezone: 'Australia/Melbourne',
  day: getDayFromDate(creationDate),
  desc: 'for testing purposes',
  time: '11:00',
  end_time: '12:00',
  url: 'https://ethanhusband.com',
  location: 'the cloud',
  show_in_upcoming: true,
  notification_minutes_before: '5' // The serialiser should extract this from the requested user and place here!
};
