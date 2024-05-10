import { UserDbObject } from '../api/schema/database/user';
import { UserFriendshipDbObject, UserFriendshipPrimaryKey } from '../api/schema/database/user_friendships';
import { RelationRepository } from './relation_repository';

const TABLE_NAME = 'user_friendships';

export class UserFriendshipRepository extends RelationRepository<UserFriendshipDbObject> {
  constructor() {
    super(TABLE_NAME);
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
