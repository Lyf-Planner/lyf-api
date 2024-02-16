import { MongoClient, ServerApiVersion } from "mongodb";
import env from "../envManager";

// https://lyf-planner.atlassian.net/browse/LYFAPI-178
// Verify that users are using the correct schema - they need social.requests and not social.friend_requests

export const migrate = async () => {
  return;
  console.log("Running migration LYFAPI-178");
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
  let failed = false;

  console.log("\nMigrating users");
  for (let user of allUsers) {
    console.log(`  Migrating ${user._id}`);

    // All we do here is report anomalies, not modify anything
    if (!user.social) {
      console.error(`\tCRITICAL User ${user._id} does not have <social> field`);
      failed = true;
      continue;
    }

    if (!user.social?.requests) {
      console.error(
        `\tWARNING User ${user._id} does not have <requests> field`
      );
      failed = true;
    }

    if (user.social?.friend_requests) {
      console.error(
        `\tWARNING User ${user._id} needs to remove <friend_requests> field`
      );
      failed = true;
    }
  }

  console.log("Schema verification", failed ? "FAILED" : "SUCCESSFUL");
};
