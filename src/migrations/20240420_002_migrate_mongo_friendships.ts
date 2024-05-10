import { Kysely } from 'kysely';

import { User as MongoUser } from '../api/mongo_schema/user';
import { ID, Timestamps } from '../api/schema/database/abstract';
import { UserDbObject } from '../api/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipStatus
} from '../api/schema/database/user_friendships';
import mongoDb from '../db/mongo/mongo_db';

interface TempRelationship {
  user_id: ID;
  status: UserFriendshipStatus;
}

export async function up(db: Kysely<any>): Promise<void> {
  const usersCollection = mongoDb.usersCollection();
  const mongoUsers: MongoUser[] = await usersCollection.findAll();

  for (const user of mongoUsers) {
    const user1NewId = await getUserNewId(user.id, db);
    if (!user1NewId) {
      console.error('User', user.id, 'missing in new db');
      continue;
    }

    const friends =
      user.social.friends?.map((x) => ({ user_id: x, status: UserFriendshipStatus.Friends })) || [];
    const requests_incoming =
      user.social.requests?.map((x) => ({
        user_id: x,
        status: UserFriendshipStatus.PendingFirstAcceptance
      })) || [];
    const requests_outgoing =
      user.social.requested?.map((x) => ({
        user_id: x,
        status: UserFriendshipStatus.PendingSecondAcceptance
      })) || [];
    const relationships = [...friends, ...requests_incoming, ...requests_outgoing];

    for (const relationship of relationships) {
      const targetUserNewId = await getUserNewId(relationship.user_id, db);
      if (!targetUserNewId) {
        console.error('User', relationship.user_id, 'missing in new db');
        continue;
      }
      const updatedIdRelationship = {
        user_id: targetUserNewId,
        status: relationship.status
      };

      // Satisfy user1_id_fk < user2_id_fk
      if (user1NewId < updatedIdRelationship.user_id) {
        await transformToPgUserRelationship(user1NewId, updatedIdRelationship, db);
      }
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('user_friendships').execute();
}

const transformToPgUserRelationship = async (
  user1_id: ID,
  relationship: TempRelationship,
  db: Kysely<any>
) => {
  const pgUserRelationship: Omit<UserFriendshipDbObject, keyof Timestamps> = {
    user1_id_fk: user1_id as any,
    user2_id_fk: relationship.user_id as any,
    status: relationship.status
  };

  await db.insertInto('user_friendships').values(pgUserRelationship).execute();
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
