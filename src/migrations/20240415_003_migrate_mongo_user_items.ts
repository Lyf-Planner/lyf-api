import { Kysely } from 'kysely';

import { ListItem as MongoItem } from '../api/mongo_schema/list';
import { Permission, UserAccess } from '../api/mongo_schema/social';
import {
  ItemUserPermission,
  ItemUserRelationshipDbObject
} from '../api/schema/database/items_on_users';
import { UserDbObject } from '../api/schema/database/user';
import mongoDb from '../db/mongo/mongo_db';

export async function up(db: Kysely<any>): Promise<void> {
  const itemsCollection = mongoDb.itemsCollection();
  const mongoItems: MongoItem[] = await itemsCollection.findAll();

  await db.schema
    .alterTable('items_on_users')
    .addColumn('show_in_upcoming', 'boolean')
    .addColumn('notification_mins_before', 'integer')
    .execute();

  for (const item of mongoItems) {
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

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('items_on_users').execute();
  await db.schema
    .alterTable('items_on_users')
    .dropColumn('show_in_upcoming')
    .dropColumn('notification_mins_before')
    .execute();
}

const insertAsPgUserItem = async (user_access: UserAccess, item: MongoItem, db: Kysely<any>) => {
  const newUserId = await getUserNewId(user_access.user_id, db);
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
  const notification_mins_before = oldUserNotification
    ? parseInt(oldUserNotification.minutes_before)
    : undefined;

  const pgUserItem: ItemUserRelationshipDbObject = {
    created: new Date(),
    last_updated: new Date(),
    item_id_fk: item.id as any,
    user_id_fk: newUserId as any,
    invite_pending: user_access.permissions === Permission.Invited,
    permission:
      user_access.permissions === Permission.Invited
        ? ItemUserPermission.Editor
        : (user_access.permissions as any),
    show_in_upcoming,
    notification_mins_before,
    sorting_rank
  };

  await db.insertInto('items_on_users').values(pgUserItem).execute();
};

const getUserNewId = async (user_id: string, db: Kysely<any>) => {
  const result = await db.selectFrom('users').selectAll().where('id', '=', user_id).execute();
  if (result.length !== 1) {
    console.log('user_id', user_id, 'does not exist anymore!! Ignoring');
    return;
  }

  const pgUser = result[0] as UserDbObject;
  if (!pgUser.id) {
    console.log('Couldnt migrate user', user_id, 'with pg entry', JSON.stringify(pgUser));
    throw new Error('Wtf');
  }

  console.log('got user', user_id, 'new id', pgUser.id);
  return pgUser.id;
};
