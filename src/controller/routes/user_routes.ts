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
      '/login',
      nSecondLimiter(2),
      this.login
    );
    server.get('/autoLogin', this.autoLogin);

    server.get('/getUser', this.getUser);
    server.post('/getUsers', this.getUsers);
    server.post(
      '/createUser',
      nSecondLimiter(20),
      this.createUser
    );
    server.post('/updateMe', this.updateMe);
    server.post('/deleteMe', this.deleteMe);

    server.post(
      '/updateFriendship',
      this.updateFriendship
    );
  }
}
