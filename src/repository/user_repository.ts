import { Kysely } from 'kysely';

import { Database } from '../api/schema/database';
import { UserDbObject } from '../api/schema/user';
import { BaseRepository } from './base_repository';

export class UserRepository extends BaseRepository<UserDbObject> {
    constructor(db: Kysely<Database>) {
      super(db, 'users');
    }

    async findByUserId(user_id_value: string): Promise<UserDbObject[]> {
      return this.db.selectFrom(this.tableName)
        .selectAll()
        .where('user_id', '=', user_id_value)
        .execute();
    }
  }
