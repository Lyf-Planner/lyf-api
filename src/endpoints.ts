import { ObjectId } from "mongodb";
import { usersCollection } from ".";
import { Request, Response } from "express";
import { buildTimetable } from "./timetable/buildTimetable";
import { User } from "./types";
import { buildNotes } from "./notes/buildNotes";
import { authenticate, verifyToken } from "./auth/resolveAuth";
import * as jwt from "jsonwebtoken";
import { buildUserData, fetchSertUser } from "./userOps";

export async function login(req: Request, res: Response) {
  var { user_id, password, local_date } = req.query;
  var user = await fetchSertUser(user_id as string);
  var token = await authenticate(user as User, password as string);
  if (token) buildUserData(user as User, local_date as string);

  user.token = token;
  res.send(user);
}

export async function autoLogin(req: Request, res: Response) {
  var { token, local_date } = req.query;
  try {
    var { user_id } = verifyToken(token as string) as jwt.JwtPayload;

    var user = (await fetchSertUser(user_id)) as User;
    buildUserData(user, local_date as string);
    return user;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function updateUser(req: Request, res: Response) {
  var { user_id, ...user } = req.body;

  try {
    await usersCollection.updateOne({ user_id }, { $set: { ...user } });
    res.status(200).end();
  } catch (err) {
    res.status(500).end(`${err}`);
  }
}
