import { NoticeDbObject } from '../../../schema/database/notices';
import { EntityRepository } from './_entity_repository';

const TABLE_NAME = 'notices';

export class NoticeRepository extends EntityRepository<NoticeDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByVersion(version: string) {
    return await this.db
    .selectFrom('notices')
    .selectAll()
    .where('version', '=', version)
    .execute();
  }
}
