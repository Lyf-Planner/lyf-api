import { Kysely } from 'kysely';

import { User as MongoUser } from '../../types/mongo_schema/user';
import { ID, Timestamps } from '../../types/schema/database/abstract';
import { UserDbObject } from '../../types/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipStatus
} from '../../types/schema/database/user_friendships';
import mongoDb from '../mongo/mongo_db';

interface TempRelationship {
  user_id: ID;
  status: UserFriendshipStatus;
}

export async function up(db: Kysely<any>): Promise<void> {
  const usersCollection = mongoDb.usersCollection();
  const mongoUsers: MongoUser[] = await usersCollection.findAll();

  for (const user of mongoUsers) {
    const user1NewId = user.id;
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
      const targetUserNewId = relationship.user_id;
      if (!targetUserNewId) {
        console.error('User', relationship.user_id, 'missing in new db');
        continue;
      }
      const updatedIdRelationship = {
        user_id: targetUserNewId,
        status: relationship.status
      };

      // Satisfy user1_id_fk < user2_id_fk
      if (user1NewId.localeCompare(updatedIdRelationship.user_id) < 0) {
        await transformToPgUserRelationship(user1NewId, updatedIdRelationship, db);
      }
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  // await db.deleteFrom('user_friendships').execute();
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

  console.log("Inserting friendship between", user1_id, relationship.user_id);
  await db.insertInto('user_friendships').values(pgUserRelationship).execute();
};
