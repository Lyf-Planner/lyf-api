import { User } from '../api/schema/user';
import { BaseModel } from './base_model';

export class UserModel extends BaseModel<User> {
  constructor(content: User, requestor: User) {
    super(content, requestor);
  }
}
