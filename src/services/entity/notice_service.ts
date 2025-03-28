import { ID } from '../../../schema/database/abstract';
import { NoticeEntity } from '../../models/entity/notice_entity';
import { NoticeRepository } from '../../repository/entity/notice_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';

import { EntityService } from './_entity_service';

// Notices are designed to be read-only to the API and user. They are managed by admins in Lyf Analytics.

export class NoticeService extends EntityService {
  protected logger = Logger.of(NoticeService.name);

  async getNotices(version: ID, exclude: ID[]) {
    const repository = new NoticeRepository();

    const notices = await repository.findByMajorVersion(version);

    return notices.filter((notice) => !exclude.includes(notice.id) && !NoticeEntity.isExpired(notice));
  }

  public processCreation(): Promise<void> {
    throw new LyfError('Not permitted.', 500);
  }
  public processDeletion(): Promise<void> {
    throw new LyfError('Not permitted.', 500);
  }
  public processUpdate(): Promise<void> {
    throw new LyfError('Not permitted.', 500);
  }
}
