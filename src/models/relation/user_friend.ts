import { UserDbObject, UserPublicFields } from '../../api/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipRelations
} from '../../api/schema/database/user_friendships';
import { UserFriend } from '../../api/schema/user';
import { BaseRelation } from './base_relation';

export class UserFriendRelation extends BaseRelation<UserFriend> {
  protected parse(combined_db_object: UserDbObject & UserFriendshipDbObject): UserFriend {
    return {
      user_id: combined_db_object.user_id,
      created: combined_db_object.created,
      last_updated: combined_db_object.last_updated,
      display_name: combined_db_object.display_name,
      pfp_url: combined_db_object.pfp_url,
      status: combined_db_object.status
    };
  }
}
