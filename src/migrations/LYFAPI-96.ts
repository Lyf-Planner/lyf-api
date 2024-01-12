import { MongoClient, ServerApiVersion } from "mongodb";
import env from "../envManager";

// https://lyf-planner.atlassian.net/browse/LYFAPI-96
// Migrate timestamps from UTC format to ISO format

export const migrate = async () => {
  return;
  console.log("Starting migration LYFAPI-96");
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
    migrateItemInCollection(user, "users", lyf_db);
  }

  const allItems = await lyf_db.collection("items").find().toArray();
  console.log("\nMigrating items");
  for (let item of allItems) {
    await migrateItemInCollection(item, "items", lyf_db);
  }

  const allNotes = await lyf_db.collection("notes").find().toArray();
  console.log("\nMigrating notes");
  for (let note of allNotes) {
    await migrateItemInCollection(note, "notes", lyf_db);
  }
};

const migrateItemInCollection = async (
  item: any,
  collection_name: string,
  lyf_db: any
) => {
  try {
    console.log("\tMigrating", collection_name, item._id);
    var last_updated = item.last_updated
      ? new Date(item.last_updated).toISOString()
      : new Date().toISOString();
    var created = item.created
      ? new Date(item.created).toISOString()
      : new Date().toISOString();
    console.log(
      "\tSetting created to",
      created,
      "last_updated to",
      last_updated
    );
    await lyf_db
      .collection(collection_name)
      .updateOne({ _id: item._id }, { $set: { created, last_updated } });
  } catch {
    throw new Error(
      `Error updating ${collection_name} ${JSON.stringify(item)}`
    );
  }
};
