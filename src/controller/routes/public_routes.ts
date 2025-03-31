import express from 'express';

import { PublicHandlers } from '@/controller/handlers/public_handlers';
import { API_PREFIX, nSecondLimiter } from '@/controller/utils';

const ROUTE_PREFIX = `${API_PREFIX}/public`

export class PublicEndpoints extends PublicHandlers {
  constructor(server: express.Application) {
    super();

    server.get(`${ROUTE_PREFIX}/notices`, nSecondLimiter(2), this.getNotices)
  }
}
