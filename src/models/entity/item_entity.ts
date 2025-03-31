import { ID } from '#/database/abstract';
import { ItemDbObject } from '#/database/items';
import { Item } from '#/items';
import { CommandType } from '@/models/_base_model';
import { SocialEntity } from '@/models/entity/_social_entity';
import { ItemUserRelation } from '@/models/relation/item_related_user';
import { ItemRepository } from '@/repository/entity/item_repository';
import { ItemUserRepository } from '@/repository/relation/item_user_repository';
import { Logger } from '@/utils/logging';
import { LyfError } from '@/utils/lyf_error';
import { ObjectUtils } from '@/utils/object';
import { Includes } from '@/utils/types';

export type ItemModelRelations = {
  users: ItemUserRelation[];
};

export class ItemEntity extends SocialEntity<ItemDbObject> {
  protected logger = Logger.of(ItemEntity.name);
  protected repository = new ItemRepository();

  protected relations: Partial<ItemModelRelations> = {};
  protected template?: ItemEntity;

  static filter(object: Includes<ItemDbObject>): ItemDbObject {
    const objectFilter: ItemDbObject = {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      title: object.title,
      type: object.type,
      status: object.status,
      collaborative: object.collaborative,
      tz: object.tz,
      date: object.date,
      day: object.day,
      desc: object.desc,
      time: object.time,
      end_time: object.end_time,
      template_id: object.template_id,
      note_id: object.note_id,
      url: object.url,
      location: object.location,
      default_show_in_upcoming: object.default_show_in_upcoming,
      default_notification_mins: object.default_notification_mins,
      default_sorting_rank: object.default_sorting_rank
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  public async exportWithPermission(requestor: ID, with_relations: boolean = true) {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.entityId());

    if (!relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load an item they should not have access to', 401);
    }

    return await this.export(requestor, with_relations);
  }

  public async export(requestor?: ID, with_relations: boolean = true): Promise<Item|ItemDbObject> {
    if (with_relations) {
      return {
        ...this.base!,
        relations: await this.recurseRelations(CommandType.Export)
      };
    } else {
      return this.base!;
    }
  }

  public async fetchRelations(include?: string | undefined): Promise<void> {
    const toLoad = include ? this.parseInclusions(include) : ['items', 'users'];

    if (toLoad.includes('items') && this.base?.template_id) {
      const template = new ItemEntity(this.base.template_id);
      await template.load();
      this.template = template;
    }

    if (toLoad.includes('users')) {
      const itemUsersRepo = new ItemUserRepository();
      const relationObjects = await itemUsersRepo.findItemRelatedUsers(this._id);
      const userRelations: ItemUserRelation[] = [];

      for (const relationObject of relationObjects) {
        const userRelation = new ItemUserRelation(relationObject.item_id_fk, relationObject.user_id_fk, relationObject);
        userRelations.push(userRelation);
      }
      this.relations.users = userRelations;
    }
  }

  public async update(changes: Partial<ItemDbObject>): Promise<void> {
    const updatedBase = ItemEntity.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  // --- HELPERS --- //
  isFullyScheduled() {
    return this.base!.date && this.base!.time;
  }

  isRoutine() {
    const { date, day, template_id } = this.base!;
    return !!day && !date && !template_id;
  }

  getRelations() {
    return this.relations;
  }

  name() {
    return this.base
      ? `${this.base!.title} (${this._id})`
      : this._id;
  }

  // --- GETTERS --- //

  date() {
    return this.base!.date;
  }

  day() {
    return this.base!.day;
  }

  status() {
    return this.base!.status;
  }

  templateId() {
    return this.base!.template_id;
  }

  time() {
    return this.base!.time;
  }

  timezone() {
    return this.base!.tz;
  }

  title() {
    return this.base!.title;
  }

  type() {
    return this.base!.type;
  }

  noteId() {
    return this.base!.note_id;
  }
}
