import { Request, Response } from 'express';

import { User } from '../../../schema/user';
import { AuthService } from '../../services/auth_service';
import { UserService } from '../../services/entity/user_service';
import { FriendshipService, FriendshipUpdate } from '../../services/relation/friendship_service';
import { Logger } from '../../utils/logging';
import { LyfError } from '../../utils/lyf_error';
import { InclusionString, getMiddlewareVars } from '../utils';
import {
  deleteMeBody,
  getUserQuery,
  loginQuery,
  updateFriendshipBody,
  updateMeBody
} from '../validators/user_validators';
import { UserDbObject } from '../../../schema/database/user';
import { ID, Identifiable } from '../../../schema/database/abstract';
import { NotificationService } from '../../services/entity/notification_service';
import { NotificationDbObject } from '../../../schema/database/notifications';
import { NoticeService } from '../../services/entity/notice_service';

export class UserHandlers {
  protected async login(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    const { user_id, password, include } = req.query as loginQuery & InclusionString;
    logger.debug(`Received login request for user ${user_id}`);

    try {
      const { user, token } = await AuthService.loginUser(user_id, password, include || "");

      res.status(200).json({ user, token }).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async autoLogin(req: Request, res: Response) {
    const { include } = req.query as InclusionString
    const user_id = getMiddlewareVars(res).user_id;

    // The auth middleware has already done all the work here
    logger.debug(`Authorized autologin for user ${user_id}`);

    const userService = new UserService();

    try {
      const user = await userService.getEntity(user_id, include);
      user.directlyModify({ last_updated: new Date() });

      res.status(200).json(await user.export()).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getUser(req: Request, res: Response) {
    const { user_id, include } = req.query as getUserQuery;
    const requestorId = getMiddlewareVars(res).user_id;

    logger.debug(`Received request for user ${user_id} from "${requestorId}"`);

    const userService = new UserService();

    try {
      const user = await userService.retrieveForUser(user_id as string, requestorId, include);

      res.status(200).json(user).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getUserNotifications(req: Request, res: Response) {
    const { limit } = req.query as { limit: string };
    const requestorId = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving notifications of ${requestorId}`);

    const notificationService = new NotificationService();

    try {
      const notifications = await notificationService.getUserNotifications(requestorId, Number(limit));

      res.status(200).json(notifications).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getNotices(req: Request, res: Response) {
    const { version, exclude } = req.query as { version: string, exclude: string };
    const noticeService = new NoticeService();

    try {
      const excludeList = exclude.split(',');
      const notices = await noticeService.getNotices(version, excludeList);

      res.status(200).json(notices).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async updateNotification(req: Request, res: Response) {
    const changes = req.body as Partial<NotificationDbObject> & Identifiable;
    const requestorId = getMiddlewareVars(res).user_id;

    logger.debug(`Received request for user ${requestorId} notifications"`);

    const notificationService = new NotificationService();

    try {
      const notifications = await notificationService.processUpdate(changes.id, changes, requestorId);

      res.status(200).json(notifications).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async createUser(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    const { user_id, password, tz } = req.body;

    logger.info(`Received request to create account "${user_id}"`);

    try {
      const { user, token } = await AuthService.register(user_id, password, tz);

      res.status(201).json({ user, token }).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  // Update user identified in header.
  // This endpoint should not permit Premium updates in future
  protected async updateMe(req: Request, res: Response) {
    const user = req.body as Partial<UserDbObject>;
    const userId = getMiddlewareVars(res).user_id;

    const userService = new UserService();

    try {
      // The work in terms of data safety is done by the validators
      const updatedUser = await userService.processUpdate(userId, user, userId);

      res.status(200).json(updatedUser).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async deleteMe(req: Request, res: Response) {
    const { password } = req.body as deleteMeBody;
    const user_id = getMiddlewareVars(res).user_id;

    logger.info(`Received self-deletion request from ${user_id}`);

    const userService = new UserService();

    try {
      userService.processDeletion(user_id, password, user_id);
      res.status(204).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async updateFriendship(req: Request, res: Response) {
    const update = req.body as FriendshipUpdate;
    const fromId = getMiddlewareVars(res).user_id;

    const service = new FriendshipService();

    try {
      const friendship = await service.processUpdate(fromId, update);
      res.status(200).json(friendship).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }
}

const logger = Logger.of(UserHandlers);
