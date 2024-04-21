import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { UserDbObject, UserID } from '../api/schema/user';
import { BaseRepository } from './base_repository';

export class UserRepository extends BaseRepository<UserDbObject> {
  constructor(db: Kysely<Database>) {
    super(db, 'users');
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
