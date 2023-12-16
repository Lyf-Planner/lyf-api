import { Request, Response } from "express";
import { UserEndpoints } from "./rest/user";
import { ItemEndpoints } from "./rest/item";
import { NoteEndpoints } from "./rest/note";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import env from "./envManager";

const server = express();

dotenv.config();

//middleware
server.use(cors());
server.use(express.json());

async function main() {
  server.get("/", (req: Request, res: Response) => {
    res.send("Lyf API!");
  });

  // Users
  const users = new UserEndpoints(server);
  // Items
  const items = new ItemEndpoints(server);
  // Notes
  const notes = new NoteEndpoints(server);

  const PORT = env.port;

  server.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`);
  });
}

main();
