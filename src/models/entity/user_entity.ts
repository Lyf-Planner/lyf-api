import { ID } from '../../api/schema/database/abstract';
import { UserDbObject, UserExposedFields, UserPublicFields, UserSensitiveFields } from '../../api/schema/database/user';
import { UserFriendshipStatus } from '../../api/schema/database/user_friendships';
import {
  ExposedUser,
  PublicUser,
  User
} from '../../api/schema/user';
import { UserRepository } from '../../repository/entity/user_repository';
import { ItemUserRepository } from '../../repository/relation/item_user_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { UserFriendshipRepository } from '../../repository/relation/user_friendship_repository';
import { daysInRange } from '../../utils/dates';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { CommandType } from '../command_types';
import { UserFriendRelation } from '../relation/user_friend';
import { UserItemRelation } from '../relation/user_related_item';
import { UserNoteRelation } from '../relation/user_related_note';
import { BaseEntity } from './_base_entity';

export type UserModelRelations = {
  items: UserItemRelation[];
  notes: UserNoteRelation[];
  users: UserFriendRelation[];
};

export class UserEntity extends BaseEntity<UserDbObject> {
  protected logger = Logger.of(UserEntity);
  protected repository = new UserRepository();

  protected relations: Partial<UserModelRelations> = {};

  public async export(requestor?: ID, with_relations = true): Promise<ExposedUser|PublicUser|UserExposedFields|UserPublicFields> {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.id());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load an item they should not have access to', 401);
    }

    if (requestor !== this._id) {
      return await this.exportAsPublicUser();
    }

    if (with_relations) {
      return {
        ...this.stripSensitiveFields(),
        relations: await this.recurseRelations(CommandType.Export)
      };
    }

    return this.stripSensitiveFields();
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
      throw new Error('User tried to retrieve sensitive fields on another user');
    }

    return { expo_tokens: this.base!.expo_tokens, pass_hash: this.base!.pass_hash };
  }

  public async fetchRelations(include?: string | undefined): Promise<void> {
    const toLoad = include ? this.parseInclusions(include) : ['items', 'notes', 'users'];

    if (toLoad.includes('items')) {
      const userItemsRepo = new ItemUserRepository();
      const relationObjects = await userItemsRepo.findRelationsByIdB(this._id);
      const itemRelations: UserItemRelation[] = [];

      for (const relationObject of relationObjects) {
        const itemRelation = new UserItemRelation(relationObject.user_id_fk, relationObject.item_id_fk);
        itemRelations.push(itemRelation);
      }
      this.relations.items = itemRelations;
    }

    if (toLoad.includes('notes')) {
      const userNotesRepo = new NoteUserRepository();
      const relationObjects = await userNotesRepo.findRelationsByIdB(this._id);
      const noteRelations: UserNoteRelation[] = [];

      for (const relationObject of relationObjects) {
        const noteRelation = new UserNoteRelation(relationObject.user_id_fk, relationObject.note_id_fk);
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

        const userRelation = new UserFriendRelation(this._id, otherUserId);
        if (userRelation.blocked()) {
          continue;
        }

        userRelations.push(userRelation);
      }
      this.relations.users = userRelations;
    }
  }

  public async fetchItemsInRange(start: string, end: string): Promise<void> {
    const userItemsRepo = new ItemUserRepository();
    const relevantDays = daysInRange(start, end);
    const relationObjects = await userItemsRepo.findUserFilteredItems(this._id, start, end, relevantDays);
    const itemRelations: UserItemRelation[] = [];

    for (const relationObject of relationObjects) {
      const itemRelation = new UserItemRelation(relationObject.user_id_fk, relationObject.item_id_fk);
      itemRelations.push(itemRelation);
    }
    this.relations.items = itemRelations;
  }

  public getRelations() {
    return this.relations;
  }

  // --- HELPERS --- //

  timezone() {
    return this.base!.tz;
  }

  dailyNotificationTime() {
    return this.base!.daily_notification_time;
  }

  persistentNotifications() {
    return this.base!.persistent_daily_notification;
  }

  private async exportAsPublicUser(with_relations = true): Promise<PublicUser|UserPublicFields> {
    const publicUserFields: UserPublicFields = {
      created: this.base!.created,
      last_updated: this.base!.last_updated,
      id: this.base!.id,
      display_name: this.base!.display_name,
      pfp_url: this.base!.pfp_url
    };

    if (with_relations) {
      return {
        ...publicUserFields,
        relations: await this.recurseRelations(CommandType.Export)
      };
    }

    return publicUserFields;
  }

  private stripSensitiveFields() {
    const { pass_hash, expo_tokens, ...exported } = this.base!;
    return exported;
  }
}
