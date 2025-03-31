import assert from 'assert';

import { NextFunction, Request, Response } from 'express';

import { API_PREFIX } from '@/controller/utils';
import { AuthService } from '@/services/auth_service';
import { Logger } from '@/utils/logging';
import { LyfError } from '@/utils/lyf_error';

const logger = new Logger('AuthMiddleware');
const TOKEN_PREFIX = 'Bearer ';
const EXCLUDED_ENDPOINTS = ['/users/login', '/users/create', 'users/notices'].map((x) => API_PREFIX + x);

export const authoriseHeader = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (EXCLUDED_ENDPOINTS.includes(req.path)) {
    next();
  } else {
    try {
      const header = (req.headers.authorization ||
        req.headers.Authorization) as string;
      let token;

      if (header && header.startsWith(TOKEN_PREFIX)) {
        token = header.substring(TOKEN_PREFIX.length);
      } else {
        throw new LyfError('Invalid Authorization header', 401);
      }

      const { user_id, exp } = AuthService.verifyToken(token);
      assert(exp! > Math.floor(new Date().getTime() / 1000));

      // Grant the user_id to subsequent functions after this middleware, via response locals
      res.locals.user_id = user_id;
      next();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.debug(lyfError.message);
      const message = 'Unauthorised or expired token in request header';
      logger.warn(message);
      res.status(401).end(message);
    }
  }
};
