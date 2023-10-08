import { ObjectId } from "mongodb";
import { usersCollection } from ".";
import { buildTimetable } from "./timetable/buildTimetable";
import { buildNotes } from "./notes/buildNotes";
import { User } from "./types";

export async function fetchSertUser(user_id: string) {
  console.log("Got fetchSertUser request", user_id);
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

  console.log("Returning user", user);
  return user;
}

export function buildUserData(user: User, local_date: string) {
  buildTimetable(user as User, local_date as string);
  buildNotes(user as User);
}
