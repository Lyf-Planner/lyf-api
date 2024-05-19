import { Request, Response } from 'express';

import { Logger } from '../../../utils/logging';
import { getMiddlewareVars } from '../../utils';
import {
  deleteMeBody,
  getUserQuery,
  loginQuery,
  updateFriendshipBody,
  updateMeBody
} from '../../validators/userValidators';
import { UserService } from '../../../services/entity/user_service';
import { User } from '../../../api/schema/user';
import { AuthService } from '../../../services/auth_service';
import { FriendshipService } from '../../../services/relation/friendship_service';

export class UserHandlers {
  protected async login(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    const { user_id, password } = req.query as loginQuery;
    logger.debug(`Received login request for user ${user_id}`);

    const userService = new UserService();

    try {
      const userModel = await userService.retrieveForUser(user_id as string, user_id as string);

      const token = await AuthService.authenticate(userModel, password as string);
      if (!token) {
        res.status(401).end('Incorrect password');
        return;
      }

      const exportedData = await userModel.export();
      const payload = { user: exportedData, token };

      res.status(200).json(payload).end();
    } catch (err) {
      res.status(404).end(`User ${user_id} does not exist`);
      return;
    }
  }

  protected async autoLogin(req: Request, res: Response) {
    const user_id = getMiddlewareVars(res).user_id;

    // The auth middleware has already done all the work here

    logger.debug(`Authorized autologin for user ${user_id}`);

    const userService = new UserService();

    try {
      const userModel = await userService.retrieveForUser(user_id, user_id);
      res.status(200).json(userModel.export()).end();
    } catch (err) {
      logger.error(err);
      res.status(401).end();
    }
  }

  protected async getUser(req: Request, res: Response) {
    const { user_id } = req.query as getUserQuery;
    const requestorId = getMiddlewareVars(res).user_id;

    logger.debug(`Received request for user ${user_id} from "${requestorId}"`);

    const userService = new UserService();

    try {
      const userModel = await userService.retrieveForUser(user_id as string, requestorId);
      res.status(200).json(userModel.export(requestorId)).end();
    } catch (err) {
      res.status(400).end('User not found');
    }
  }

  protected async getUsers(req: Request, res: Response) {
    const { user_ids } = req.body;
    const requestorId = getMiddlewareVars(res).user_id;

    logger.debug(`Received request for user ids ${user_ids} from "${requestorId}"`);

    const userService = new UserService();

    const users = await userService.retrieveManyUsers(user_ids, requestorId);
    res.status(200).json(users).end();
  }

  protected async createUser(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    const { user_id, password, tz } = req.body;

    logger.info(`Received request to create account "${user_id}"`);

    try {
      // const userModel = await new UserService().initialiseUser(user_id, password, tz);
      // const user = userModel.export(true);

      // const token = await new AuthService().authenticate(userModel.getEntity(), password);

      const userService = new UserService();

      const { user, token } = await userService.processCreation(user_id, password, tz);
      

      res.status(201).json({ user, token }).end();
    } catch (err) {
      logger.error(err);
      res.status(400).end(err);
      return;
    }
  }

  // Update user identified in header.
  // This endpoint should not permit Premium updates in future
  protected async updateMe(req: Request, res: Response) {
    const user = req.body as User;
    const userId = getMiddlewareVars(res).user_id;

    const userService = new UserService();

    try {
      // The work in terms of data safety is done by the validators
      const userModel = await userService.processUpdate(user.id, user, userId);

      res.status(200).json(userModel.export()).end();
    } catch (err) {
      res.status(400).end(`${err}`);
      return;
    }
  }

  protected async deleteMe(req: Request, res: Response) {
    const { password } = req.body as deleteMeBody;
    const user_id = getMiddlewareVars(res).user_id;

    logger.info(`Received self-deletion request from ${user_id}`);

    const userService = new UserService();

    // Authorisation checks
    try {
      const userModel = await userService.retrieveForUser(user_id, user_id);
      const token = await AuthService.authenticate(userModel, password);
      if (!token) {
        throw new Error('Incorrect password');
      }

      // Perform delete
      await userModel.delete();
      res.status(204).end();
    } catch (err) {
      logger.error(`User ${user_id} entered incorrect password when trying to delete self`);
      res.status(401).end(`${err}`);
      return;
    }
  }

  protected async updateFriendship(req: Request, res: Response) {
    const update = req.body as updateFriendshipBody;
    const fromId = getMiddlewareVars(res).user_id;

    const service = new FriendshipService();

    try {
      const friendships = await service.processUpdate(fromId, update);
      res.status(200).json(friendships).end();
    } catch (err) {
      logger.error(`Returning 400 with message: ${err}`);
      res.status(400).end(`${err}`);
    }
  }
}

const logger = Logger.of(UserHandlers);
