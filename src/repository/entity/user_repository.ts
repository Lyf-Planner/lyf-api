
import { ID } from '#/database/abstract';
import { UserDbObject } from '#/database/user';
import { EntityRepository } from '@/repository/entity/_entity_repository';

const TABLE_NAME = 'users';

export class UserRepository extends EntityRepository<UserDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByUserId(user_id: ID): Promise<UserDbObject | undefined> {
    return this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk, '=', user_id)
      .executeTakeFirst();
  }

  async findManyByUserId(user_ids: ID[]): Promise<UserDbObject[]> {
    return this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk, 'in', user_ids)
      .execute();
  }
}
