
import { ID } from '#/database/abstract';
import { NotificationDbObject } from '#/database/notifications';
import { EntityRepository } from '@/repository/entity/_entity_repository';

const TABLE_NAME = 'notifications';

export class NotificationRepository extends EntityRepository<NotificationDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByTo(to: ID, limit?: number) {
    if (limit) {
      return await this.db
        .selectFrom('notifications')
        .limit(limit)
        .selectAll()
        .where('to', '=', to)
        .orderBy('created desc')
        .execute();
    }

    return await this.db
      .selectFrom('notifications')
      .selectAll()
      .where('to', '=', to)
      .orderBy('created desc')
      .execute();
  }
}
