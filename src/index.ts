import { updateUser, autoLogin, login, deleteMe } from "./rest/endpoints";
import { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import env from "./envManager";

const dotenv = require("dotenv");
const express = require("express");
const server = express();
const cors = require("cors");

dotenv.config();

//middleware
server.use(cors());
server.use(express.json());

async function main() {
  const nSecondLimiter = (n: number) =>
    rateLimit({
      windowMs: n * 1000, // n * 1000 where the window is n seconds
      limit: 1, // Requests per window
    });

  server.get("/", (req: Request, res: Response) => {
    res.send("Lyf API!");
  });

  // Users
  server.get("/login", nSecondLimiter(5), login);
  server.get("/autoLogin", autoLogin);

  server.post("/updateUser", nSecondLimiter(5), updateUser);
  server.post("/deleteMe", deleteMe);

  server.post("/createItem");
  server.post("/updateItem");
  server.post("/removeItem");
  server.get("/getItem");

  const PORT = env.port;

  server.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`);
  });
}

main();
