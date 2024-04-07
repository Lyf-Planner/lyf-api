import { Request, Response } from "express";
import { User } from "../../api/mongo_schema/user";
import { UserModel } from "../../models/users/userModel";
import { UserOperations } from "../../models/users/userOperations";
import { Logger } from "../../utils/logging";
import { getMiddlewareVars } from "../utils";
import {
  deleteMeBody,
  getUserQuery,
  loginQuery,
  updateFriendshipBody,
  updateMeBody,
} from "../validators/userValidators";
import authUtils from "../../utils/authUtils";
import { FriendshipManager } from "../../models/social/friendshipManager";

export class UserHandlers {
  protected async login(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    var { user_id, password } = req.query as loginQuery;
    logger.debug(`Received login request for user ${user_id}`);

    var userModel;
    try {
      userModel = await UserOperations.retrieveForUser(
        user_id as string,
        user_id as string
      );
    } catch (err) {
      res.status(404).end(`User ${user_id} does not exist`);
      return;
    }

    var token = await authUtils.authenticate(
      userModel.getUser() as User,
      password as string
    );
    if (!token) {
      res.status(401).end("Incorrect password");
      return;
    }

    var exportedData = userModel.export();
    var payload = { user: exportedData, token };

    res.status(200).json(payload).end();
  }

  protected async autoLogin(req: Request, res: Response) {
    var user_id = getMiddlewareVars(res).user_id;

    // The auth middleware has already done all the work here

    logger.debug(`Authorized autologin for user ${user_id}`);

    try {
      var userModel = await UserOperations.retrieveForUser(user_id, user_id);
      res.status(200).json(userModel.export()).end();
    } catch (err) {
      logger.error(err);
      res.status(401).end();
    }
  }

  protected async getUser(req: Request, res: Response) {
    var { user_id } = req.query as getUserQuery;
    var requestor_id = getMiddlewareVars(res).user_id;

    logger.debug(`Received request for user ${user_id} from "${requestor_id}"`);

    try {
      var userModel = await UserOperations.retrieveForUser(
        user_id as string,
        requestor_id
      );
      res.status(200).json(userModel.getUser(false)).end();
    } catch (err) {
      res.status(400).end("User not found");
    }
  }

  protected async getUsers(req: Request, res: Response) {
    var { user_ids } = req.body;
    var requestor_id = getMiddlewareVars(res).user_id;

    logger.debug(
      `Received request for user ids ${user_ids} from "${requestor_id}"`
    );

    var users = await UserOperations.retrieveManyUsers(user_ids);
    res.status(200).json(users).end();
  }

  protected async createUser(req: Request, res: Response) {
    // This endpoint is excluded from the auth middleware
    var { user_id, password, timezone } = req.body;

    logger.info(`Received request to create account "${user_id}"`);
    var token;
    var user;

    try {
      user = await UserOperations.createNew(user_id, password, true, timezone);
      token = await authUtils.authenticate(
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
    const user_id = getMiddlewareVars(res).user_id;

    try {
      // The work in terms of data safety is done by the validators
      var remoteModel = await UserOperations.retrieveForUser(user_id, user_id);
      await remoteModel.updateSelf(user);
      res.status(200).json(remoteModel.export()).end();
    } catch (err) {
      res.status(400).end(`${err}`);
      return;
    }
  }

  protected async deleteMe(req: Request, res: Response) {
    var { password } = req.body as deleteMeBody;
    var user_id = getMiddlewareVars(res).user_id;

    logger.info(`Received self-deletion request from ${user_id}`);

    // Authorisation checks
    var user: UserModel;

    try {
      var user = (await UserOperations.retrieveForUser(
        user_id,
        user_id
      )) as UserModel;
      var token = await authUtils.authenticate(
        user.getUser() as User,
        password as string
      );
      if (!token) throw new Error("Incorrect password");

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
    var update = req.body as updateFriendshipBody;
    var from_id = getMiddlewareVars(res).user_id;

    try {
      let social = await FriendshipManager.processUpdate(from_id, update);
      res.status(200).json(social).end();
    } catch (err) {
      logger.error(`Returning 400 with message: ${err}`);
      res.status(400).end(`${err}`);
    }
  }
}

const logger = Logger.of(UserHandlers);
