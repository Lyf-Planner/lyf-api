import { EntitySubgraph } from '../../../api/schema';
import { ID } from '../../../api/schema/database/abstract';
import { UserDbObject, UserSensitiveFields } from '../../../api/schema/database/user';
import {
  ExposedUser,
  PublicUser,
  User
} from '../../../api/schema/user';
import { UserRepository } from '../../../repository/entity/user_repository';
import { Logger } from '../../../utils/logging';
import { LyfError } from '../../../utils/lyf_error';
import { CommandType } from '../command_types';
import { UserFriendRelation } from '../relation/user_friend';
import { UserItemRelation } from '../relation/user_related_item';
import { UserNoteRelation } from '../relation/user_related_note';
import { BaseEntity } from './base_entity';

export type UserModelRelations = {
  items: UserItemRelation[];
  notes: UserNoteRelation[];
  users: UserFriendRelation[];
};

export class UserEntity extends BaseEntity<UserDbObject> {
  protected logger = Logger.of(UserEntity);
  protected repository = new UserRepository();

  protected relations: Partial<UserModelRelations> = {};

  public async export(requestor?: ID): Promise<ExposedUser|PublicUser> {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.id());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load an item they should not have access to', 401);
    }

    if (requestor !== this._id) {
      return await this.exportAsPublicUser();
    }

    return {
      ...this.stripSensitiveFields(),
      relations: await this.recurseRelations<EntitySubgraph>(CommandType.Export)
    };
  }

  // --- Helpers ---

  public isPrivate() {
    return this.baseEntity!.private;
  }

  public name() {
    return this.baseEntity!.display_name || this.baseEntity!.id;
  }

  public getSensitive(requestor: ID): UserSensitiveFields {
    if (requestor !== this._id) {
      throw new Error('User tried to retrieve sensitive fields on another user');
    }

    return { expo_tokens: this.baseEntity!.expo_tokens, pass_hash: this.baseEntity!.pass_hash };
  }

  private async exportAsPublicUser(): Promise<PublicUser> {
    return {
      created: this.baseEntity!.created,
      last_updated: this.baseEntity!.last_updated,
      id: this.baseEntity!.id,
      display_name: this.baseEntity!.display_name,
      pfp_url: this.baseEntity!.pfp_url,
      relations: await this.recurseRelations<EntitySubgraph>(CommandType.Export)
    };
  }

  private stripSensitiveFields() {
    const { pass_hash, expo_tokens, ...exported } = this.baseEntity!;
    return exported;
  }
}
