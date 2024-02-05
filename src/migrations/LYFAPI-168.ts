import { MongoClient, ServerApiVersion } from "mongodb";
import env from "../envManager";

// https://lyf-planner.atlassian.net/browse/LYFAPI-168
// Migrate users to include new fields for friends and social items

export const migrate = async () => {
  const client = new MongoClient(env.mongoUrl as string, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  var mongoConnection = await client.connect();

  var lyf_db = mongoConnection.db(env.mongoDb);
  const allUsers = await lyf_db.collection("users").find().toArray();
  console.log("\nMigrating users");
  for (let user of allUsers) {
    await lyf_db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          social: { friends: [], requests: [], requested: [], blocked: [] },
          timetable: { ...user.timetable, invited_items: [] },
          notes: { ...user.notes, invited_items: [] },
        },
      }
    );
  }
};
