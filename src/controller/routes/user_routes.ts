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
      validate(loginValidator),
      nSecondLimiter(2),
      this.login
    );
    server.get('/autoLogin', validate(autologinValidator), this.autoLogin);

    server.get('/getUser', validate(getUserValidator), this.getUser);
    server.post('/getUsers', validate(getUsersValidator), this.getUsers);
    server.post(
      '/createUser',
      creationValidator,
      nSecondLimiter(20),
      this.createUser
    );
    server.post('/updateMe', validate(updateMeValidator), this.updateMe);
    server.post('/deleteMe', validate(deleteMeValidator), this.deleteMe);

    server.post(
      '/updateFriendship',
      validate(updateFriendshipValidator),
      this.updateFriendship
    );
  }
}
