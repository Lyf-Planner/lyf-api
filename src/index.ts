import { Request, Response } from "express";
import { UserEndpoints } from "./rest/userEndpoints";
import { ItemEndpoints } from "./rest/itemEndpoints";
import { NoteEndpoints } from "./rest/noteEndpoints";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import env from "./envManager";
import bodyParserErrorHandler from "express-body-parser-error-handler";

const server = express();

dotenv.config();

//middleware
server.use(cors());
server.use(express.json());
server.use(bodyParserErrorHandler());

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
