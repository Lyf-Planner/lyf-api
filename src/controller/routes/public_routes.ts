import express from 'express';

import { API_PREFIX, nSecondLimiter } from '../utils';
import { PublicHandlers } from '../handlers/public_handlers';

const ROUTE_PREFIX = API_PREFIX + '/public'

export class PublicEndpoints extends PublicHandlers {
  constructor(server: express.Application) {
    super();

    server.get(ROUTE_PREFIX + '/notices', nSecondLimiter(2), this.getNotices)
  }
}
