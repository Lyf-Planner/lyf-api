import { MongoClient, ServerApiVersion } from "mongodb";
import env from "../envManager";

// https://lyf-planner.atlassian.net/browse/LYFAPI-23
// Migrate timestamps from UTC format to ISO format

export const migrate = async () => {
  if (env.version !== "1.0.0") return;
  console.log("Starting migration to API 2.0 Schema");
  const client = new MongoClient(env.mongoUrl as string, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  var mongoConnection = await client.connect();

  var lyf_db = mongoConnection.db(env.mongoDb);

  const allUsers = await lyf_db
    .collection("users")
    .find({ user_id: "etho" })
    .toArray();

  for (let user of allUsers) {
    var last_updated = new Date(user.last_updated).toISOString();
    var created = new Date(user.created).toISOString();
    await lyf_db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { created, last_updated } });
  }
};
