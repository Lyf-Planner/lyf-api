import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { UserFriendshipDbObject, UserFriendshipPrimaryKey } from '../api/schema/user_friendships';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'user_friendships';

export class UserFriendshipRepository extends BaseRepository<UserFriendshipDbObject> {
  constructor(db: Kysely<Database>) {
    super(db, TABLE_NAME);
  }

  async findByCompositeId({
    user1_id_fk,
    user2_id_fk
  }: UserFriendshipPrimaryKey): Promise<UserFriendshipDbObject | undefined> {
    return this.db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where('user1_id_fk', '=', user1_id_fk)
      .where('user2_id_fk', '=', user2_id_fk)
      .executeTakeFirst();
  }

  async findRelationshipsByUserId(user_id: string): Promise<UserFriendshipDbObject[]> {
    return this.db
      .selectFrom(TABLE_NAME)
      .selectAll()
      .where((eb) => eb.or([eb('user1_id_fk', '=', user_id), eb('user2_id_fk', '=', user_id)]))
      .execute();
  }
}
