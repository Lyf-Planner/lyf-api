import { Kysely } from 'kysely';
import { ListItem } from '../api/mongo_schema/list';
import { User as MongoUser } from '../api/mongo_schema/user';
import { ItemUserRelationshipDbObject } from '../api/schema/items_on_users';
import { UserDbObject } from '../api/schema/user';
import { Permission } from '../api/mongo_schema/social';

import mongoDb from '../repository/db/mongo/mongoDb';

export async function up(db: Kysely<any>): Promise<void> {
  const usersCollection = mongoDb.usersCollection();
  const mongoUsers: MongoUser[] = await usersCollection.findAll();

  await db.schema
    .alterTable('items_on_users')
    .addColumn('show_in_upcoming', 'boolean')
    .addColumn('notification_mins_before', 'boolean')
    .execute();

  const getUserNewId = async (user_id: string) => {
    const result = await db.selectFrom('users').where('user_id', '=', user_id).execute();
    if (result.length !== 1) {
      console.log('user_id', user_id, 'does not exist anymore!! Ignoring');
      return;
    }

    const pgUser = result[0] as UserDbObject;
    if (!pgUser.id) throw new Error('Wtf');
    return pgUser.id;
  };

  for (const user of mongoUsers) {
    const newId = await getUserNewId(user.id);
    if (!newId) continue;

    const items = user.timetable.items;
    const invitedItems = user.timetable.invited_items ? user.timetable.invited_items.map((x) => ({ id: x })) : [];
    const allItems = items.concat(invitedItems);

    for (const i in allItems) {
      const item = await mongoDb.itemsCollection().getById(allItems[i].id);
      if (!item) continue;
      await insertAsPgUserItem(newId, item, Boolean(allItems[i].show_in_upcoming), parseInt(i), db);
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('items_on_users').execute();
  await db.schema
    .alterTable('items_on_users')
    .dropColumn('show_in_upcoming')
    .dropColumn('notification_mins_before')
    .execute();
}

const insertAsPgUserItem = async (
  user_id: any,
  item: ListItem,
  show_in_upcoming: boolean,
  rank: number,
  db: Kysely<any>
) => {
  const getOldUserPermission = (item: ListItem, user_id: string) => {
    const invite = item?.invited_users.find((x) => x.user_id === user_id);
    const access = item?.permitted_users.find((x) => x.user_id === user_id)
    if (invite) {
      return { invite_pending: true, status: Permission.Editor }
    }

    if (access) {
      return { invite_pending: false, status: access.permissions }
    }

    return false;
  }

  const getOldUserNotification = (item: ListItem, user_id: string) => {
    const notification = item.notifications.find((x) => x.user_id === user_id);
    return notification ? parseInt(notification.minutes_before) : undefined
  }

  const permission = getOldUserPermission(item, user_id)
  if (!permission) return;

  const pgUserItem: ItemUserRelationshipDbObject = {
    created: new Date(),
    last_updated: new Date(),
    item_id_fk: item.id as any,
    user_id_fk: user_id as any,
    invite_pending: permission.invite_pending,
    status: permission.status as any,
    show_in_upcoming,
    notification_mins_before: getOldUserNotification(item, user_id),
    sorting_rank: rank
  };

  await db.insertInto('items_on_users').values(pgUserItem).execute();
};
