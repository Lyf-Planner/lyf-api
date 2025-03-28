import express from 'express';

import { UserHandlers } from '../handlers/user_handlers';
import { API_PREFIX, nSecondLimiter } from '../utils';

const ROUTE_PREFIX = `${API_PREFIX}/users`

export class UserEndpoints extends UserHandlers {
  constructor(server: express.Application) {
    super();
    server.get(`${ROUTE_PREFIX}/login`, nSecondLimiter(2), this.login);
    server.get(`${ROUTE_PREFIX}/autoLogin`, this.autoLogin);
    server.get(`${ROUTE_PREFIX}/get`, this.getUser);
    server.get(`${ROUTE_PREFIX}/notifications`, this.getUserNotifications);

    server.post(`${ROUTE_PREFIX}/create`, nSecondLimiter(20), this.createUser);
    server.post(`${ROUTE_PREFIX}/update`, this.updateMe);
    server.post(`${ROUTE_PREFIX}/delete`, this.deleteMe);
    server.post(`${ROUTE_PREFIX}/updateNotification`, this.updateNotification)

    server.post(`${ROUTE_PREFIX}/updateFriendship`,this.updateFriendship);
  }
}
