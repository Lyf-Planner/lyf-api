import { ID } from '../../../schema/database/abstract';
import { NoticeDbObject } from '../../../schema/database/notices';
import { NoticeEntity } from '../../models/entity/notice_entity';
import { NoticeRepository } from '../../repository/entity/notice_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { EntityService } from './_entity_service';

// Notices are designed to be read-only to the API and user. They are managed by admins in Lyf Analytics.

export class NoticeService extends EntityService<NoticeDbObject> {
  protected logger = Logger.of(NoticeService);

  async getNotices(version: ID, exclude: ID[]) {
    const repository = new NoticeRepository();

    const notices = await repository.findByVersion(version);

    return notices.filter((notice) => !exclude.includes(notice.id) && !NoticeEntity.isExpired(notice));
  }

  public processCreation(...args: any[]): Promise<any> {
    throw new LyfError('Not permitted.', 500);
  }
  public processDeletion(...args: any[]): Promise<any> {
    throw new LyfError('Not permitted.', 500);
  }
  public processUpdate(...args: any[]): Promise<any> {
    throw new LyfError('Not permitted.', 500);
  }
}
