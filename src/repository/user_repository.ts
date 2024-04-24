import { UserDbObject, UserID } from '../api/schema/database/user';
import { BaseRepository } from './base_repository';

const TABLE_NAME = 'users';

export class UserRepository extends BaseRepository<UserDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByUserId(user_id: UserID): Promise<UserDbObject | undefined> {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('user_id', '=', user_id)
      .executeTakeFirst();
  }

  async findManyByUserId(user_ids: UserID[]): Promise<UserDbObject[]> {
    return this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('user_id', 'in', user_ids)
      .execute();
  }
}
