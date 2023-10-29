import { MongoClient, ServerApiVersion } from "mongodb";
import { updateUser, autoLogin, login, deleteMe } from "./endpoints";
import { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

const dotenv = require("dotenv");
const express = require("express");
const server = express();
const cors = require("cors");

dotenv.config();

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URL as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middleware
server.use(cors());
server.use(express.json());

const db = client.db("lyf-tmp");
export const usersCollection = db.collection("users");

async function main() {
  await client.connect();
  const nSecondLimiter = (n: number) => rateLimit({
    windowMs: n * 1000, // n * 1000 where the window is n seconds
    limit: 1, // Requests per window
  });


  server.get("/", (req: Request, res: Response) => {
    res.send("Lyf API!");
  });

  // Users
  server.get("/login", nSecondLimiter(30), login);
  server.get("/autoLogin", autoLogin);
  server.post("/updateUser", nSecondLimiter(5), updateUser);
  server.post("/deleteMe", deleteMe);

  const PORT = process.env.PORT || 8000;

  server.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`);
  });
}

main();
