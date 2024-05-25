import { NextFunction, Request, Response } from 'express';

import assert from 'assert';
import { Logger } from '../../utils/logging';
import { AuthService } from '../../services/auth_service';

const logger = new Logger('AuthMiddleware');
const TOKEN_PREFIX = 'Bearer ';
const EXCLUDED_ENDPOINTS = ['/login', '/createUser'];

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
        throw new Error('Invalid Authorization header');
      }

      const { user_id, exp } = AuthService.verifyToken(token);
      assert(exp! > Math.floor(new Date().getTime() / 1000));

      // Grant the user_id to subsequent functions after this middleware, via response locals
      res.locals.user_id = user_id;
      next();
    } catch (err) {
      logger.debug(err);
      const message = 'Unauthorised or expired token in request header';
      logger.warn(message);
      res.status(401).end(message);
    }
  }
};
