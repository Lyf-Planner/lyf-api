import { ID } from '#/database/abstract';
import { NoticeDbObject } from '#/database/notices';
import { BaseEntity } from '@/models/entity/_base_entity';
import { NoticeRepository } from '@/repository/entity/notice_repository';
import { Logger } from '@/utils/logging';
import { ObjectUtils } from '@/utils/object';
import { Includes } from '@/utils/types';

// This is mostly just here for consistency
// Notices have no wrapping functionality or relations,
// For the most part we just pass on db objects instead of wrapping with this.

export class NoticeEntity extends BaseEntity<NoticeDbObject> {
  protected logger = Logger.of(NoticeEntity.name);
  protected repository = new NoticeRepository();

  protected relations = {};

  static filter(object: Includes<NoticeDbObject>): NoticeDbObject {
    const objectFilter: NoticeDbObject = {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      version: object.version,
      type: object.type,
      title: object.title,
      content: object.content,
      image_url: object.image_url,
      expiry: object.expiry,
      rank: object.rank
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

  public async update(changes: Partial<NoticeDbObject>): Promise<void> {
    const updatedBase = NoticeEntity.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  static isExpired(notice: NoticeDbObject) {
    if (!notice.expiry) {
      return false;
    }

    return new Date(notice.expiry).getTime() < new Date().getTime();
  }
}
