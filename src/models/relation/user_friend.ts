import { UserDbObject, UserPublicFields } from '../../api/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipRelations
} from '../../api/schema/database/user_friendships';
import { UserFriend } from '../../api/schema/user';
import { BaseRelation } from './base_relation';

export class UserFriendRelation extends BaseRelation<UserFriend> {
  protected parseBase(base_db_object: UserDbObject): UserPublicFields {
    return {
      user_id: base_db_object.user_id,
      created: base_db_object.created,
      last_updated: base_db_object.last_updated,
      display_name: base_db_object.display_name,
      pfp_url: base_db_object.pfp_url
    };
  }

  protected parseRelation(relation_db_object: UserFriendshipDbObject): UserFriendshipRelations {
    const { user1_id_fk, user2_id_fk, ...relations } = relation_db_object;
    return relations;
  }

  protected parse(
    base_db_object: UserDbObject,
    relation_db_object: UserFriendshipDbObject
  ): UserFriend {
    return {
      ...this.parseBase(base_db_object),
      ...this.parseRelation(relation_db_object)
    };
  }
}
