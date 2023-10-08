import { ObjectId } from "mongodb";
import { usersCollection } from ".";
import { buildTimetable } from "./timetable/buildTimetable";
import { buildNotes } from "./notes/buildNotes";
import { User } from "./types";

export async function fetchSertUser(user_id: string) {
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

  return user;
}

export function buildUserData(user: User, local_date: string) {
  buildTimetable(user as User, local_date as string);
  buildNotes(user as User);
}

export async function saveUser(user: User) {
  await usersCollection.updateOne(
    { user_id: user?.user_id },
    { $set: { ...user } }
  );
}
