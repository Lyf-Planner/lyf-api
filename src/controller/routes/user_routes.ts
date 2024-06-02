import express from 'express';

import { UserHandlers } from '../handlers/user_handlers';
import { validate } from '../middleware/validation_middleware';
import { nSecondLimiter } from '../utils';
import {
  autologinValidator,
  creationValidator,
  deleteMeValidator,
  getUsersValidator,
  getUserValidator,
  loginValidator,
  updateFriendshipValidator,
  updateMeValidator
} from '../validators/user_validators';

export class UserEndpoints extends UserHandlers {
  constructor(server: express.Application) {
    super();
    server.get(
      '/user/login',
      nSecondLimiter(2),
      this.login
    );
    server.get('/user/autoLogin', this.autoLogin);
    server.get('/user/get', this.getUser);

    server.post(
      '/user/create',
      nSecondLimiter(20),
      this.createUser
    );
    server.post('/user/update', this.updateMe);
    server.post('/user/delete', this.deleteMe);

    server.post(
      '/user/updateFriendship',
      this.updateFriendship
    );
  }
}
