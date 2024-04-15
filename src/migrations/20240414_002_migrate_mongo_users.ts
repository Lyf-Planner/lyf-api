import { Kysely } from 'kysely';

import { User as MongoUser } from '../api/mongo_schema/user';
import { UserDbObject as PostgresUser } from '../api/schema/user';
import {v4 as uuid } from 'uuid';
import mongoDb from '../repository/db/mongo/mongoDb';

export async function up(db: Kysely<any>): Promise<void> {
  const usersCollection = mongoDb.usersCollection();
  const mongoUsers: MongoUser[] = await usersCollection.findAll();

  for (const user of mongoUsers) {
    await db.insertInto('users').values(transformToPgUser(user)).execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('users').execute();
}

const transformToPgUser = (user: MongoUser) => {
  const pgUser: PostgresUser = {
    id: uuid() as any,
    user_id: user.id,
    created: user.created,
    last_updated: user.last_updated,
    pass_hash: user.pass_hash,
    expo_tokens: user.expo_tokens || [],
    private: false,
    tz: user.timezone || 'Australia/Melbourne',
    first_day: user.timetable.first_day,
    display_name: user.details.name,
    pfp_url: user.details.pfp_url,
    daily_notifications: user.premium?.notifications?.daily_notifications,
    daily_notification_time: user.premium?.notifications?.daily_notification_time,
    persistent_daily_notification: user.premium?.notifications?.persistent_daily_notification,
    event_notifications_enabled: user.premium?.notifications?.event_notifications_enabled,
    event_notification_minutes_before: user.premium?.notifications
      ?.event_notification_minutes_before
      ? parseInt(user.premium?.notifications?.event_notification_minutes_before)
      : undefined
    // Since 'id', 'created', and 'last_updated' are auto-generated, they are omitted
  };

  return pgUser;
};
