import { ID } from '../../../schema/database/abstract';
import { UserDbObject, UserExposedFields, UserPublicFields, UserSensitiveFields } from '../../../schema/database/user';
import { UserFriendshipStatus } from '../../../schema/database/user_friendships';
import {
  ExposedUser,
  PublicUser,
  UserFriend
} from '../../../schema/user';
import { NotificationRepository } from '../../repository/entity/notification_repository';
import { UserRepository } from '../../repository/entity/user_repository';
import { ItemUserRepository } from '../../repository/relation/item_user_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { UserFriendshipRepository } from '../../repository/relation/user_friendship_repository';
import { daysInRange } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { ObjectUtils } from '../../utils/object';
import { Extension } from '../../utils/types';
import { CommandType } from '../command_types';
import { UserFriendRelation } from '../relation/user_friend';
import { UserItemRelation } from '../relation/user_related_item';
import { UserNoteRelation } from '../relation/user_related_note';

import { BaseEntity } from './_base_entity';
import { NotificationEntity } from './notification_entity';

export type UserModelRelations = {
  items: UserItemRelation[];
  notes: UserNoteRelation[];
  notifications: NotificationEntity[];
  users: UserFriendRelation[];
};

export class UserEntity extends BaseEntity<UserDbObject> {
  protected logger = Logger.of(UserEntity.name);
  protected repository = new UserRepository();

  protected relations: Partial<UserModelRelations> = {};

  static filter(object: Extension<UserDbObject>): UserDbObject {
    const objectFilter: Required<UserDbObject> = {
      id: object.id,
      created: object.created,
      last_updated: object.last_updated,
      display_name: object.display_name,
      pfp_url: object.pfp_url,
      private: object.private,
      tz: object.tz,
      first_day: object.first_day,
      daily_notification_time: object.daily_notification_time,
      persistent_daily_notification: object.persistent_daily_notification,
      event_notification_mins: object.event_notification_mins,
      pass_hash: object.pass_hash,
      expo_tokens: object.expo_tokens,
      weather_data: object.weather_data,
      auto_day_finishing: object.auto_day_finishing
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  public async export(requestor?: ID, with_relations: boolean = true): Promise<ExposedUser|PublicUser|UserExposedFields|UserPublicFields> {
    const selfRequested = requestor === this._id

    if (requestor && !selfRequested) {
      return await this.exportAsPublicUser(requestor);
    }

    if (with_relations) {
      return {
        ...this.stripSensitiveFields(),
        relations: await this.recurseRelations(CommandType.Export)
      };
    }

    return this.stripSensitiveFields();
  }

  public async update(changes: Partial<UserDbObject>): Promise<void> {
    const updatedBase = UserEntity.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  // --- Helpers ---

  public isPrivate() {
    return this.base!.private;
  }

  public name() {
    return this.base!.display_name || this.base!.id;
  }

  public getSensitive(requestor: ID): UserSensitiveFields {
    if (requestor !== this._id) {
      throw new LyfError('User tried to retrieve sensitive fields on another user', 403);
    }

    return { expo_tokens: this.base!.expo_tokens, pass_hash: this.base!.pass_hash };
  }

  public async fetchRelations(include?: string | undefined, limit?: number): Promise<void> {
    const toLoad = include !== undefined ? this.parseInclusions(include) : ['items', 'notes', 'users', 'notifications'];

    if (toLoad.includes('items')) {
      const userItemsRepo = new ItemUserRepository();
      const relationObjects = await userItemsRepo.findUserRelatedItems(this._id);
      const itemRelations: UserItemRelation[] = [];

      for (const relationObject of relationObjects) {
        const itemRelation = new UserItemRelation(relationObject.user_id_fk, relationObject.item_id_fk, relationObject);
        itemRelations.push(itemRelation);
      }
      this.relations.items = itemRelations;
    }

    if (toLoad.includes('notes')) {
      const userNotesRepo = new NoteUserRepository();
      const relationObjects = await userNotesRepo.findUserRelatedNotes(this._id);
      const noteRelations: UserNoteRelation[] = [];

      for (const relationObject of relationObjects) {
        const noteRelation = new UserNoteRelation(relationObject.user_id_fk, relationObject.note_id_fk, relationObject);
        noteRelations.push(noteRelation);
      }
      this.relations.notes = noteRelations;
    }

    if (toLoad.includes('users')) {
      const userFriendsRepo = new UserFriendshipRepository();
      const relationObjects = await userFriendsRepo.findUserFriends(this._id);
      const userRelations: UserFriendRelation[] = [];

      for (const relationObject of relationObjects) {
        const otherUserId = relationObject.user1_id_fk === this._id ? relationObject.user2_id_fk : relationObject.user1_id_fk;

        const userRelation = new UserFriendRelation(this._id, otherUserId, relationObject);

        if (userRelation.blocked()) {
          continue;
        }

        userRelations.push(userRelation);
      }
      this.relations.users = userRelations;
    }

    if (toLoad.includes('notifications')) {
      const notificationsRepo = new NotificationRepository();
      const notificationObjects = await notificationsRepo.findByTo(this._id, limit);
      this.relations.notifications = notificationObjects.map((x) => new NotificationEntity(x.id, x));
    }
  }

  public async fetchItemsInRange(start: string, end: string): Promise<void> {
    const userItemsRepo = new ItemUserRepository();
    const relevantDays = daysInRange(start, end);

    const relationObjects = await userItemsRepo.findUserFilteredItems(this._id, start, end, relevantDays);
    const itemRelations: UserItemRelation[] = [];

    for (const relationObject of relationObjects) {
      const itemRelation = new UserItemRelation(relationObject.user_id_fk, relationObject.item_id_fk, relationObject);
      itemRelations.push(itemRelation);
    }

    this.relations.items = itemRelations;
  }

  public async fetchItemsInFuture(start_date: string): Promise<void> {
    const userItemsRepo = new ItemUserRepository();

    const relationObjects = await userItemsRepo.findUserFutureItems(this._id, start_date);
    const itemRelations: UserItemRelation[] = [];

    for (const relationObject of relationObjects) {
      const itemRelation = new UserItemRelation(relationObject.user_id_fk, relationObject.item_id_fk, relationObject);
      itemRelations.push(itemRelation);
    }

    this.relations.items = itemRelations;
  }

  public getRelations() {
    return this.relations;
  }

  // --- HELPERS --- //

  blocksMe(user_id: string) {
    if (!this.relations.users) {
      throw new LyfError('checked blocked on a user without loading relations', 500);
    }

    return this.relations.users.some((x) => x.entityId() === user_id && x.blockedByEntity());
  }

  blockedByMe(user_id: string) {
    if (!this.relations.users) {
      throw new LyfError('checked blocked on a user without loading relations', 500);
    }

    return this.relations.users.some((x) => x.entityId() === user_id && x.blockedByMe());
  }

  timezone() {
    return this.base!.tz;
  }

  dailyNotificationTime() {
    return this.base!.daily_notification_time;
  }

  persistentNotifications() {
    return this.base!.persistent_daily_notification;
  }

  weatherLocation() {
    return this.base!.weather_data;
  }

  private async exportAsPublicUser(requestor_id: ID, with_relations: boolean = true): Promise<PublicUser|UserPublicFields> {
    const publicUserFields: UserPublicFields = {
      created: this.base!.created,
      last_updated: this.base!.last_updated,
      id: this.base!.id,
      display_name: this.base!.display_name,
      pfp_url: this.base!.pfp_url
    };

    if (with_relations) {
      // When exporting a public user, expose only a users friends when requested by a friend
      const { users } = await this.recurseRelations(CommandType.Export) as { users?: UserFriend[] }

      const requestorIsFriend = users && users.some((x) => x.id === requestor_id);
      const relations = requestorIsFriend ? {
        users: users.filter((x) => x.status === UserFriendshipStatus.Friends)
      } : {};

      return {
        ...publicUserFields,
        relations
      };
    }

    return publicUserFields;
  }

  private stripSensitiveFields() {
    const {
      pass_hash: _pass_hash,
      expo_tokens: _expo_tokens,
      ...exported
    } = this.base!;

    return exported;
  }
}
