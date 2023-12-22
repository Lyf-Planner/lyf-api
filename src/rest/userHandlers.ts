import { Request, Response } from "express";
import { User } from "../api/user";
import authUtils from "../auth/authUtils";
import { UserModel } from "../models/userModel";
import assert from "assert";
import * as jwt from "jsonwebtoken";
import { UserOperations } from "../models/userOperations";

export class UserHandlers {
  protected testRest(req: Request, res: Response) {
    res.send("RestTestWorks!");
  }

  protected async login(req: Request, res: Response) {
    var { user_id, password } = req.query;

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
    console.log("Sending payload", payload);
    res.status(200).json(payload).end();
  }

  protected async autoLogin(req: Request, res: Response) {
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    try {
      var userModel = await UserOperations.retrieveForUser(user_id, user_id);
      res.status(200).json(userModel.export()).end();
    } catch (err) {
      console.log(err);
      res.status(401).end();
    }
  }

  protected async getUser(req: Request, res: Response) {
    var { user_id } = req.body;
    var requestor_id = authUtils.authoriseHeader(req, res);
    if (!requestor_id) return;

    var userModel = await UserOperations.retrieveForUser(user_id, requestor_id);
    res.status(200).json(userModel.export()).end();
  }

  protected async getUsers(req: Request, res: Response) {
    var { user_ids } = req.body;

    var users = await UserOperations.retrieveManyUsers(user_ids);
    res.status(200).json(users).end();
  }

  protected async createUser(req: Request, res: Response) {
    var { user_id, password } = req.body;

    try {
      var user = await UserOperations.createNew(user_id, password, true);
    } catch (err) {
      res.status(400).end(`Username ${user_id} is already taken`);
    }

    res.status(200).json(user!.export()).end();
  }

  // Should consider breaking this up in future
  protected async updateUser(req: Request, res: Response) {
    var { user } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Users must be authorised as themselves to update said account!
    if (user.id !== user_id) {
      res
        .status(401)
        .end("You must be authorised as this user to update account data");
      return;
    }

    try {
      var remoteModel = await UserOperations.retrieveForUser(user.id, user_id);
      await remoteModel.safeUpdate(user, user_id);
    } catch (err) {
      res.status(403).end(err);
      return;
    }

    res.send(200).end();
  }

  protected async deleteMe(req: Request, res: Response) {
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var user: UserModel;
    try {
      var user = await UserOperations.retrieveForUser(user_id, user_id);
    } catch (err) {
      res.status(403).end(err);
    }

    // Perform delete
    await user!.deleteFromDb();
    res.status(200).end();
  }
}
