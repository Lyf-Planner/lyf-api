import { Request, Response } from 'express';

import { User } from '../../api/mongo_schema/user';
import { FriendshipManager } from '../../models/social/friendshipManager';
import { UserModel } from '../../models/users/userModel';
import { UserOperations } from '../../models/users/userOperations';
import authUtils from '../../utils/authUtils';
import { Logger } from '../../utils/logging';
import { getMiddlewareVars } from '../utils';
import {
  deleteMeBody,
  getUserQuery,
  loginQuery,
  updateFriendshipBody,
  updateMeBody
} from '../validators/userValidators';

export class UserHandlers {
  protected async login(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    const { user_id, password } = req.query as loginQuery;
    logger.debug(`Received login request for user ${user_id}`);

    try {
      const userModel = await UserOperations.retrieveForUser(
        user_id as string,
        user_id as string
      );

      const token = await authUtils.authenticate(
        userModel.getUser() as User,
        password as string
      );
      if (!token) {
        res.status(401).end('Incorrect password');
        return;
      }

      const exportedData = userModel.export();
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

    try {
      const userModel = await UserOperations.retrieveForUser(user_id, user_id);
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

    try {
      const userModel = await UserOperations.retrieveForUser(
        user_id as string,
        requestorId
      );
      res.status(200).json(userModel.getUser(false)).end();
    } catch (err) {
      res.status(400).end('User not found');
    }
  }

  protected async getUsers(req: Request, res: Response) {
    const { user_ids } = req.body;
    const requestorId = getMiddlewareVars(res).user_id;

    logger.debug(
      `Received request for user ids ${user_ids} from "${requestorId}"`
    );

    const users = await UserOperations.retrieveManyUsers(user_ids);
    res.status(200).json(users).end();
  }

  protected async createUser(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    const { user_id, password, timezone } = req.body;

    logger.info(`Received request to create account "${user_id}"`);

    try {
      const user = await UserOperations.createNew(user_id, password, true, timezone);
      const token = await authUtils.authenticate(
        user.getUser() as User,
        password as string
      );
      res.status(201).json({ user: user?.export(), token }).end();
    } catch (err) {
      logger.error(err);
      res.status(400).end(`Username ${user_id} is already taken`);
      return;
    }
  }

  // Update user identified in header.
  // This endpoint should not permit Premium updates in future
  protected async updateMe(req: Request, res: Response) {
    const user = req.body as updateMeBody;
    const userId = getMiddlewareVars(res).user_id;

    try {
      // The work in terms of data safety is done by the validators
      const remoteModel = await UserOperations.retrieveForUser(userId, userId);
      await remoteModel.updateSelf(user);
      res.status(200).json(remoteModel.export()).end();
    } catch (err) {
      res.status(400).end(`${err}`);
      return;
    }
  }

  protected async deleteMe(req: Request, res: Response) {
    const { password } = req.body as deleteMeBody;
    const user_id = getMiddlewareVars(res).user_id;

    logger.info(`Received self-deletion request from ${user_id}`);

    // Authorisation checks
    try {
      const user = (await UserOperations.retrieveForUser(
        user_id,
        user_id
      )) as UserModel;
      const token = await authUtils.authenticate(
        user.getUser() as User,
        password as string
      );
      if (!token) { throw new Error('Incorrect password'); }

      // Perform delete
      await user!.deleteFromDb();
      res.status(204).end();
    } catch (err) {
      logger.error(
        `User ${user_id} entered incorrect password when trying to delete self`
      );
      res.status(401).end(`${err}`);
      return;
    }
  }

  protected async updateFriendship(req: Request, res: Response) {
    const update = req.body as updateFriendshipBody;
    const fromId = getMiddlewareVars(res).user_id;

    try {
      const social = await FriendshipManager.processUpdate(fromId, update);
      res.status(200).json(social).end();
    } catch (err) {
      logger.error(`Returning 400 with message: ${err}`);
      res.status(400).end(`${err}`);
    }
  }
}

const logger = Logger.of(UserHandlers);
