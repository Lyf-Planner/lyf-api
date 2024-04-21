import { User } from '../api/schema/user';
import { UserFriendship } from '../api/schema/user_friendships';
import { BaseModel } from './base_model';

export class UserFriendshipModel extends BaseModel<UserFriendship> {
  constructor(content: UserFriendship, requestor: User) {
    super(content, requestor);
  }
}
