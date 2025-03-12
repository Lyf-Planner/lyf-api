import { ID } from '../../../schema/database/abstract';
import { NoticeDbObject } from '../../../schema/database/notices';
import { NoticeRepository } from '../../repository/entity/notice_repository';
import { Logger } from '../../utils/logging';
import { ObjectUtils } from '../../utils/object';
import { BaseEntity } from './_base_entity';

// This is mostly just here for consistency
// Notices have no wrapping functionality or relations,
// For the most part we just pass on db objects instead of wrapping with this.

export class NoticeEntity extends BaseEntity<NoticeDbObject> {
  protected logger = Logger.of(NoticeEntity);
  protected repository = new NoticeRepository();

  protected relations = {};

  static filter(object: any): NoticeDbObject {
    const objectFilter: Required<NoticeDbObject> = {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      version: object.version,
      type: object.type,
      title: object.title,
      content: object.content,
      image_url: object.image_url,
      expiry: object.expiry,
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  public async export(requestor?: ID, with_relations: boolean = true): Promise<NoticeDbObject> {
    return this.base!;
  }

  public async fetchRelations(include?: string | undefined): Promise<void> {
    // No relations
  }


  public getRelations() {
    // No implementation
  }

  static isExpired(notice: NoticeDbObject) {
    if (!notice.expiry) {
      return false;
    }

    return new Date(notice.expiry).getTime() < new Date().getTime();
  }
}
