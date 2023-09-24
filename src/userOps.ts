import { ObjectId } from "mongodb";
import { usersCollection } from ".";
import { Request, Response } from "express";
import { buildTimetable } from "./timetable";

export async function fetchSertUser(req: Request, res: Response) {
  const { user_id } = req.query;
  console.log("Got fetchSertUser request for");
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

  buildTimetable(user);
  console.log("Returning user", user);
  res.send(user);
}

export async function updateUser(req: Request, res: Response) {
  var { user_id, ...user } = req.body;
  
  try {
    await usersCollection.updateOne({ user_id }, { $set: { ...user } });
    res.status(200);
  } catch (err) {
    res.status(500).end(`${err}`);
  }
}
