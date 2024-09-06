import { Kysely } from 'kysely';

import { ListItem as MongoItem, ListItemTypes } from '../../types/mongo_schema/list';
import { ItemDbObject as PostgresItem, ItemType } from '../../types/schema/database/items';
import mongoDb from '../mongo/mongo_db';
import { ItemUserRelationshipDbObject, Permission as ItemUserPermission } from '../../types/schema/database/items_on_users';
import { Permission, UserAccess } from '../../types/mongo_schema/social';

export async function up(db: Kysely<any>): Promise<void> {
  const itemsCollection = mongoDb.itemsCollection();
  const mongoItems: MongoItem[] = await itemsCollection.findAll();

  for (const item of mongoItems) {
    if (item.template_id) {
      await insertAsPgItem(item, db);

      // Upload all user relations
      const users = item.permitted_users;
      const invitedUsers = item.invited_users ? item.invited_users : [];
      const allUsers = users.concat(invitedUsers);

      for (const user of allUsers) {
        try {
          await insertAsPgUserItem(user, item, db);
        } catch {
          continue;
        }
      }
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  // await db.deleteFrom('items').execute();
  // await db.deleteFrom('items_on_users').execute();
}

const insertAsPgItem = async (item: MongoItem, db: Kysely<any>) => {
  const owner = await mongoDb.usersCollection().getById(item.permitted_users[0].user_id, false);
  const intendedTimezone = owner?.timezone || 'Australia/Melbourne';

  // Verify template item exists
  let uploaded_template_id = undefined;
  if (item.template_id) {
    const template_item = await db
      .selectFrom('items')
      .where('id', '=', item.template_id as any)
      .execute();
    if (template_item.length) {
      uploaded_template_id = item.template_id as any;
    }
  }

  const pgItem: PostgresItem = {
    id: item.id as any,
    created: item.created,
    last_updated: item.last_updated,
    title: item.title,
    collaborative: item.permitted_users.length > 1,
    type: item.type === ListItemTypes.Item ? ItemType.Task : (item.type as any),
    status: item.status,
    tz: intendedTimezone,
    date: item.date, // yyyy-mm-dd
    day: item.day,
    desc: item.desc,
    time: item.time, // hh:mm
    end_time: item.end_time,
    template_id: uploaded_template_id,
    url: item.url,
    location: item.location,
    default_show_in_upcoming: item.show_in_upcoming,
    default_notification_mins: undefined
  };

  console.log("Inserting template item", item.id)
  await db.insertInto('items').values(pgItem).execute();
};

const insertAsPgUserItem = async (user_access: UserAccess, item: MongoItem, db: Kysely<any>) => {
  const oldUser = await mongoDb.usersCollection().getById(user_access.user_id);
  const oldUserTargetArray =
    user_access.permissions === Permission.Invited
      ? oldUser?.timetable.invited_items?.map((x) => ({ id: x, show_in_upcoming: false }))
      : oldUser?.timetable.items;
  const oldUserRelationshipIndex = oldUserTargetArray
    ? oldUserTargetArray.findIndex((x) => x.id === item.id)
    : -1;

  let show_in_upcoming = false;
  let sorting_rank = 0;
  if (oldUserRelationshipIndex !== -1) {
    show_in_upcoming = Boolean(oldUserTargetArray![oldUserRelationshipIndex].show_in_upcoming);
    sorting_rank = oldUserRelationshipIndex;
  }

  const oldUserNotification = item.notifications.find((x) => x.user_id === user_access.user_id);
  const notification_mins = oldUserNotification
    ? (parseInt(oldUserNotification.minutes_before) || undefined)
    : undefined;

  const pgUserItem: ItemUserRelationshipDbObject = {
    created: new Date(),
    last_updated: new Date(),
    item_id_fk: item.id as any,
    user_id_fk: user_access.user_id as any,
    invite_pending: user_access.permissions === Permission.Invited,
    permission:
      user_access.permissions === Permission.Invited
        ? ItemUserPermission.Editor
        : (user_access.permissions as any),
    show_in_upcoming,
    notification_mins,
    sorting_rank
  };

  // Need to circumvent the issue of people creating items in the time this script takes
  // Only piece of data where this is really a concern.
  let pgItem = await db.selectFrom('items')
    .selectAll()
    .where('id', '=', pgUserItem.item_id_fk)
    .executeTakeFirst(); 
  if (!pgItem) {
    console.log("ITEM", item.id, 'IS MISSING PG ITEM!!');
    await insertAsPgItem(item, db);
    console.log
  }

  console.log("Inserting item-user relationship", JSON.stringify(pgUserItem));
  try {
    await db.insertInto('items_on_users').values(pgUserItem).execute();
  } catch {
    console.log("FAILED TO UPLOAD")
  }
};
