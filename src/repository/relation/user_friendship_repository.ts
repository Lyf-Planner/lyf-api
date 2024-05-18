import { ID } from '../../api/schema/database/abstract';
import { UserDbObject } from '../../api/schema/database/user';
import { UserFriendshipDbObject } from '../../api/schema/database/user_friendships';
import { RelationRepository } from './_relation_repository';

const TABLE_NAME = 'user_friendships';

export class UserFriendshipRepository extends RelationRepository<UserFriendshipDbObject> {
  protected readonly pk_a = 'user1_id_fk';
  protected readonly pk_b = 'user2_id_fk';

  constructor() {
    super(TABLE_NAME);
  }

  public async deleteRelation(user1_id: ID, user2_id: ID) {
    const [id1, id2] = this.sortIds(user1_id, user2_id)

    await this.db
      .deleteFrom(this.table_name)
      .where(this.pk_a, '=', id1)
      .where(this.pk_b, '=', id2)
      .execute();
  }

  override async findByCompositeId(user1_id: ID, user2_id: ID): Promise<UserFriendshipDbObject | undefined> {
    const [id1, id2] = this.sortIds(user1_id, user2_id)

    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_a, '=', id1)
      .where(this.pk_b, '=', id2)
      .executeTakeFirst();

    return result as UserFriendshipDbObject | undefined;
  }

  async findUserFriends(user_id: string): Promise<(UserDbObject & UserFriendshipDbObject)[]> {
    const lesserUsers = await this.db
      .selectFrom(TABLE_NAME)
      .innerJoin('users', 'users.id', 'user1_id_fk')
      .selectAll()
      .where((eb) => eb('user2_id_fk', '=', user_id))
      .execute();

    const greaterUsers = await this.db
      .selectFrom(TABLE_NAME)
      .innerJoin('users', 'users.id', 'user2_id_fk')
      .selectAll()
      .where((eb) => eb('user1_id_fk', '=', user_id))
      .execute();

    return [...lesserUsers, ...greaterUsers];
  }

  async updateRelation(
    user1_id: ID, 
    user2_id: ID,
    changes: Partial<UserFriendshipDbObject>
  ) {
    // Should make the order or args not matter!!
    const [id1, id2] = this.sortIds(user1_id, user2_id)

    return await this.db
      .updateTable(TABLE_NAME)
      .set(changes)
      .where('user1_id_fk', '=', id1)
      .where('user2_id_fk', '=', id2)
      .returningAll()
      .execute();
  }

  public sortIds(user1_id: ID, user2_id: ID): [ID, ID] {
    if (user1_id.localeCompare(user2_id) > 0) {
      return [user2_id, user1_id];
    } else {
      return [user1_id, user2_id]
    }
  }
}
