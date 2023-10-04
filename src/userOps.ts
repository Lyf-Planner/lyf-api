import { ObjectId } from "mongodb";
import { usersCollection } from ".";
import { Request, Response } from "express";
import { buildTimetable } from "./timetable/buildTimetable";
import { User } from "./types";
import { buildNotes } from "./notes/buildNotes";

export async function fetchSertUser(req: Request, res: Response) {
  const { user_id, local_date } = req.query;
  console.log("Got fetchSertUser request", user_id, "for", local_date);
  var user = await usersCollection.findOne({ user_id });
  if (!user) {
    console.log("No user found, creating");
    await usersCollection.insertOne({
      _id: new ObjectId(),
      user_id,
    });
    user = { user_id };
  } else {
    // Filter out Mongo Id
    delete user._id;
  }

  buildTimetable(user as User, local_date as string);
  buildNotes(user as User);
  console.log("Returning user", user);
  res.send(user);
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
