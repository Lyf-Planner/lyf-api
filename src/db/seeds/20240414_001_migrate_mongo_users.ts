// import { Kysely } from 'kysely';

// import { User as MongoUser } from '../../types/mongo_schema/user';
// import { UserDbObject as PostgresUser } from '#/database/user';
// import mongoDb from '../mongo/mongo_db';

// export async function up(db: Kysely<any>): Promise<void> {
//   const usersCollection = mongoDb.usersCollection();
//   const mongoUsers: MongoUser[] = await usersCollection.findAll();

//   for (const user of mongoUsers) {
//     console.log("Transforming user", user.id);
//     await db.insertInto('users').values(transformToPgUser(user)).execute();
//   }
// }

// export async function down(db: Kysely<any>): Promise<void> {
//   // await db.deleteFrom('users').execute();
// }

// const transformToPgUser = (user: MongoUser) => {
//   const pgUser: PostgresUser = {
//     id: user.id,
//     created: user.created,
//     last_updated: user.last_updated,
//     pass_hash: user.pass_hash,
//     expo_tokens: user.expo_tokens || [],
//     private: false,
//     tz: user.timezone || 'Australia/Melbourne',
//     first_day: user.timetable.first_day,
//     display_name: user.details?.name,
//     pfp_url: user.details?.pfp_url,
//     daily_notification_time: user.premium?.notifications?.daily_notification_time,
//     persistent_daily_notification: user.premium?.notifications?.persistent_daily_notification,
//     event_notification_mins: user.premium?.notifications?.event_notifications_enabled
//       ? parseInt(user.premium?.notifications?.event_notification_minutes_before || '5', 10)
//       : undefined,
//   };

//   return pgUser;
// };
