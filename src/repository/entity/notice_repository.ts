import { sql } from 'kysely';

import { NoticeDbObject } from '../../../schema/database/notices';

import { EntityRepository } from './_entity_repository';

const TABLE_NAME = 'notices';

export class NoticeRepository extends EntityRepository<NoticeDbObject> {
  constructor() {
    super(TABLE_NAME);
  }

  async findByMajorVersion(version: string) {
    const majorVersion = version.split('.').slice(0, 2).join('.');
    const likeRegex = `${majorVersion}%`;

    return await this.db
      .selectFrom('notices')
      .selectAll()
      .where((db) => sql`${db.ref('version')} LIKE ${likeRegex}`)
      .execute();
  }

  async findByVersion(version: string) {
    return await this.db
      .selectFrom('notices')
      .selectAll()
      .where('version', '=', version)
      .execute();
  }
}
