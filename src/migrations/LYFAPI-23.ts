import { MongoClient, ServerApiVersion } from "mongodb";
import env from "../envManager";
import { v4 as uuid } from "uuid";
import { NoteType } from "../api/notes";
import { ItemStatus, ListItemTypes } from "../api/list";
import moment from "moment";

// https://lyf-planner.atlassian.net/browse/LYFAPI-23
// Migrate old database lyf-tmp (1.0.0) to a new database with the API 2.0 Schema

export const migrate = async () => {
  return;
  console.log("Starting migration to API 2.0 Schema");
  const client = new MongoClient(env.mongoUrl as string, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  var mongoConnection = await client.connect();

  var lyf_tmp = mongoConnection.db("lyf-tmp");
  var lyf_db = mongoConnection.db(env.mongoDb);

  const allUsers = await lyf_tmp
    .collection("users")
    .find({ user_id: "90arbiter90" })
    .toArray();
  console.log(
    "Got all users",
    allUsers.map((x) => x.user_id)
  );

  for (let user of allUsers) {
    console.log("\nProcessing user", user.user_id);

    const user_notes = await processNotes(user, lyf_db);

    const user_items = await processItems(user, lyf_db);

    let newUser = {
      _id: user.user_id,
      pass_hash: user.pass_hash,
      timetable: {
        items: user_items,
      },
      notes: {
        items: user_notes,
      },
      friends: [],
      friend_requests: [],
      premium: user.premium || { enabled: false },
      created: new Date(user.created || user.last_updated).toUTCString(),
      last_updated: new Date(user.last_updated).toUTCString(),
    };

    console.log(
      "Uploading user",
      newUser._id,
      "with",
      user_items.length,
      "items and",
      user_notes.length,
      "notes"
    );

    await lyf_db.collection("users").insertOne(newUser);
  }
};

const processNotes = async (user: any, lyf_prod: any) => {
  var notes = user.notes.items;
  var userReferences = [];

  console.log("\tUploading", notes.length, "notes for user", user.user_id);
  for (var note of notes) {
    let noteContent = note.content;
    if (note.type === NoteType.List) {
      var newContent = [];
      for (var item of noteContent) {
        newContent.push({
          id: item.id || uuid(),
          title: item.name,
          type: ListItemTypes.Item,
          status:
            item.status ||
            (item.finished ? ItemStatus.Done : ItemStatus.Upcoming),
          permitted_users: [{ user_id: user.user_id, permissions: "Owner" }],
        });
      }
      noteContent = newContent;
    }

    let newNote = {
      _id: note.id || uuid(),
      title: note.title,
      type: note.type,
      content: noteContent,
      permitted_users: [{ user_id: user.user_id, permissions: "Owner" }],
      last_updated: new Date().toUTCString(),
      created: new Date().toUTCString(),
    };

    await lyf_prod.collection("notes").insertOne(newNote);
    userReferences.push({ id: note.id });
  }
  console.log("\tUploaded", userReferences.length, "notes");

  return userReferences;
};

// Helper for processItems
const getTemplateItems = (user: any) => {
  var template = user.timetable.templates[0];
  var items = [];
  for (var weekday of Object.values(template) as any) {
    if (weekday.events) {
      for (let event of weekday.events) {
        items.push({
          _id: event.id || uuid(),
          title: event.name,
          type: ListItemTypes.Event,
          date: null,
          day: weekday.day,
          time: event.time,
          permitted_users: [{ user_id: user.user_id, permissions: "Owner" }],
          status:
            event.status ||
            (event.finished ? ItemStatus.Done : ItemStatus.Upcoming),
        });
      }
    }
    if (weekday.tasks) {
      for (let task of weekday.tasks) {
        items.push({
          _id: task.id || uuid(),
          title: task.name,
          type: ListItemTypes.Task,
          date: null,
          day: weekday.day,
          permitted_users: [{ user_id: user.user_id, permissions: "Owner" }],
          status:
            task.status ||
            (task.finished ? ItemStatus.Done : ItemStatus.Upcoming),
        });
      }
    }
  }

  return items;
};

// Helper for processItems
const getMiscItems = (user: any) => {
  var items = [];
  for (var event of user.timetable.upcoming as any) {
    items.push({
      _id: event.id || uuid(),
      title: event.name,
      type: ListItemTypes.Event,
      date: null,
      day: null,
      time: event.time,
      permitted_users: [{ user_id: user.user_id, permissions: "Owner" }],
      status:
        event.status ||
        (event.finished ? ItemStatus.Done : ItemStatus.Upcoming),
    });
  }

  for (var task of user.timetable.todo as any) {
    items.push({
      _id: task.id || uuid(),
      title: task.name,
      type: ListItemTypes.Task,
      date: null,
      day: null,
      permitted_users: [{ user_id: user.user_id, permissions: "Owner" }],
      status:
        task.status || (task.finished ? ItemStatus.Done : ItemStatus.Upcoming),
    });
  }

  return items;
};

const getTimetableItems = (user: any, templateNames: any) => {
  var timetableItems = [];
  // Exclude any template instances
  for (let week of user.timetable.weeks) {
    for (let day of Object.values(week) as any) {
      if (!day.date || day?.date.slice(0, 4) !== "2024") continue;
      if (day.events) {
        for (let event of day.events) {
          if (templateNames.includes(event.name)) continue;
          else
            timetableItems.push({
              _id: event.id || uuid(),
              title: event.name,
              type: ListItemTypes.Event,
              date: moment(new Date(day.date)).format("YYYY-MM-DD"),
              day: null,
              time: event.time,
              permitted_users: [
                { user_id: user.user_id, permissions: "Owner" },
              ],
              status:
                event.status ||
                (event.finished ? ItemStatus.Done : ItemStatus.Upcoming),
            });
        }
      }
      if (day.tasks) {
        for (let task of day.tasks) {
          if (templateNames.includes(task.name)) continue;
          else
            timetableItems.push({
              _id: task.id || uuid(),
              title: task.name,
              type: ListItemTypes.Task,
              date: moment(new Date(day.date)).format("YYYY-MM-DD"),
              day: null,
              permitted_users: [
                { user_id: user.user_id, permissions: "Owner" },
              ],
              status:
                task.status ||
                (task.finished ? ItemStatus.Done : ItemStatus.Upcoming),
            });
        }
      }
    }
  }

  return timetableItems;
};

const processItems = async (user: any, lyf_prod: any) => {
  var userReferences = [];

  const templateItems = getTemplateItems(user);
  const miscItems = getMiscItems(user);

  const templateNames = templateItems.map((x) => x.title);
  const timetableItems = getTimetableItems(user, templateNames);

  const allItems = [...templateItems, ...miscItems, ...timetableItems];
  console.log("\tProcessed", allItems.length, "items");

  console.log("\tUploading items for user", user.user_id);
  for (let item of allItems as any) {
    await lyf_prod.collection("items").insertOne(item);
    userReferences.push({ id: item._id });
  }
  console.log("\tUploaded", userReferences.length, "items");

  return userReferences;
};
