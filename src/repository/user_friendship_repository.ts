import { UserDbObject } from '../api/schema/database/user';
import { UserFriendshipDbObject, UserFriendshipPrimaryKey } from '../api/schema/database/user_friendships';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'user_friendships';

export class UserFriendshipRepository extends BaseRepository<UserFriendshipDbObject> {
  constructor() {
    super(TABLE_NAME);
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

  async findUserFriends(user_id: string): Promise<(UserDbObject & UserFriendshipDbObject)[]> {
    const lesserUsers = await this.db
      .selectFrom(TABLE_NAME)
      .innerJoin('users', 'users.user_id', 'user1_id_fk')
      .selectAll()
      .where((eb) => eb('user2_id_fk', '=', user_id))
      .execute();

    const greaterUsers = await this.db
      .selectFrom(TABLE_NAME)
      .innerJoin('users', 'users.user_id', 'user2_id_fk')
      .selectAll()
      .where((eb) => eb('user1_id_fk', '=', user_id))
      .execute();

    return [...lesserUsers, ...greaterUsers];
  }
}
