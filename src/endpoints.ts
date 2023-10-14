import { Request, Response } from "express";
import { User } from "./types";
import { authenticate, verifyToken } from "./auth/resolveAuth";
import * as jwt from "jsonwebtoken";
import { buildUserData, fetchSertUser, saveUser } from "./userOps";
import assert from "assert";

export async function login(req: Request, res: Response) {
  var { user_id, password, local_date } = req.query;
  console.log("Logging in", user_id);

  var user = await fetchSertUser(user_id as string);
  var token = await authenticate(user as User, password as string);
  if (!token) {
    res.status(401).end();
    return;
  } else buildUserData(user as User, local_date as string);

  var { pass_hash, ...userData } = user;
  var payload = { user: userData, token };
  console.log("Sending payload", payload);
  res.status(200).send(payload).end();
}

export async function autoLogin(req: Request, res: Response) {
  var { token, local_date } = req.query;
  try {
    var { user_id, exp } = verifyToken(token as string) as jwt.JwtPayload;
    // Token has not expired!
    assert(exp! > Math.floor(new Date().getTime() / 1000));

    var user = (await fetchSertUser(user_id)) as User;
    buildUserData(user, local_date as string);
    var { pass_hash, ...userData } = user;
    res.status(200).send(userData).end();
  } catch (err) {
    console.log(err);
    res.status(401).end();
  }
}

export async function updateUser(req: Request, res: Response) {
  var { user, token } = req.body;
  var { user_id } = verifyToken(token);

  // Users must be authorised as themselves to update said account!
  if (user.user_id !== user_id) {
    res
      .status(401)
      .end("You must be authorised as this user to update account data");
    return;
  }

  try {
    await saveUser(user);
    res.status(200).end();
  } catch (err) {
    console.log("Update error", err);
    res.status(500).end(`${err}`);
  }
}
