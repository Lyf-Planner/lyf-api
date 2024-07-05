import { ID } from '../../api/schema/database/abstract';
import { ItemDbObject } from '../../api/schema/database/items';
import { NoteDbObject } from '../../api/schema/database/notes';
import { Item } from '../../api/schema/items';
import { Note } from '../../api/schema/notes';
import { ItemRepository } from '../../repository/entity/item_repository';
import { ItemUserRepository } from '../../repository/relation/item_user_repository';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { ObjectUtils } from '../../utils/object';
import { CommandType } from '../command_types';
import { ItemUserRelation } from '../relation/item_related_user';
import { SocialEntity } from './_social_entity';

export type ItemModelRelations = {
  users: ItemUserRelation[];
};

export class ItemEntity extends SocialEntity<ItemDbObject> {
  protected logger = Logger.of(ItemEntity);
  protected repository = new ItemRepository();

  protected relations: Partial<ItemModelRelations> = {};
  protected template?: ItemEntity; // TODO: Proper item-to-item relation

  static filter(object: any): ItemDbObject {
    return ObjectUtils.stripKeys({
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
      url: object.url,
      location: object.location,
      show_in_upcoming: object.show_in_upcoming,
      notification_mins_before: object.show_in_upcoming,
    }, Object.keys(object))
  }

  public async export(requestor?: ID, with_relations: boolean = true): Promise<Item|ItemDbObject> {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.id());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      console.log("got requestor", requestor)
      throw new LyfError('User tried to load an item they should not have access to', 401);
    }

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
}
