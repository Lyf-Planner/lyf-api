import { Request, Response } from "express";
import { User } from "../api/user";
import authUtils from "../auth/authUtils";
import { UserModel } from "../models/userModel";
import { UserOperations } from "../models/userOperations";
import { Logger } from "../utils/logging";

export class UserHandlers {
  protected async login(req: Request, res: Response) {
    var { user_id, password } = req.query;
    logger.info(`Received login request for user ${user_id}`);

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
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    logger.info(`Authorized autologin for user ${user_id}`);

    try {
      var userModel = await UserOperations.retrieveForUser(user_id, user_id);
      res.status(200).json(userModel.export()).end();
    } catch (err) {
      logger.error(err);
      res.status(401).end();
    }
  }

  protected async getUser(req: Request, res: Response) {
    var { user_id } = req.query;
    var requestor_id = authUtils.authoriseHeader(req, res);
    if (!requestor_id) return;

    logger.info(`Received request for user ${user_id} from "${requestor_id}"`);

    var userModel = await UserOperations.retrieveForUser(
      user_id as string,
      requestor_id
    );
    res.status(200).json(userModel.export()).end();
  }

  protected async getUsers(req: Request, res: Response) {
    var { user_ids } = req.body;
    var requestor_id = authUtils.authoriseHeader(req, res);
    if (!requestor_id) return;

    logger.info(
      `Received request for user ids ${user_ids} from "${requestor_id}"`
    );

    var users = await UserOperations.retrieveManyUsers(user_ids);
    res.status(200).json(users).end();
  }

  protected async createUser(req: Request, res: Response) {
    var { user_id, password } = req.body;

    logger.info(`Received request to create account "${user_id}"`);
    var token;
    var user;

    try {
      user = await UserOperations.createNew(user_id, password, true);
      token = await authUtils.authenticate(
        user.getUser() as User,
        password as string
      );
    } catch (err) {
      logger.error(err);
      res.status(400).end(`Username ${user_id} is already taken`);
      return;
    }

    res.status(200).json({ user: user?.export(), token }).end();
  }

  // Should consider breaking this up in future
  protected async updateUser(req: Request, res: Response) {
    var { user } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Users must be authorised as themselves to update said account!
    if (user.id !== user_id) {
      logger.error(
        `User ${user_id} tried to change username or modify another user ${user.id}`
      );
      res
        .status(401)
        .end("You must be authorised as this user to update account data");
      return;
    }

    try {
      var remoteModel = await UserOperations.retrieveForUser(user.id, user_id);
      await remoteModel.safeUpdate(user, user_id);
    } catch (err) {
      res.status(403).end(`${err}`);
      return;
    }

    res.status(200).end();
  }

  protected async deleteMe(req: Request, res: Response) {
    var { password } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    logger.info(`Received self-deletion request from ${user_id}`);

    // Authorisation checks
    var user: UserModel;

    try {
      var user = await UserOperations.retrieveForUser(user_id, user_id);
      var token = await authUtils.authenticate(
        user.getUser() as User,
        password as string
      );
      if (!token) throw new Error("Incorrect password");
    } catch (err) {
      logger.error(
        `User ${user_id} entered incorrect password when trying to delete self`
      );
      res.status(401).end(`${err}`);
      return;
    }

    // Perform delete
    await user!.deleteFromDb();
    res.status(200).end();
  }
}

const logger = Logger.of(UserHandlers);
