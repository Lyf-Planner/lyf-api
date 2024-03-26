import { Request, Response } from "express";
import { UserEndpoints } from "./controller/userEndpoints";
import { ItemEndpoints } from "./controller/itemEndpoints";
import { NoteEndpoints } from "./controller/noteEndpoints";
import { authoriseHeader } from "./controller/authMiddleware";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import env from "./envManager";
import bodyParserErrorHandler from "express-body-parser-error-handler";
import db from "./repository/dbAccess";
import notificationManager from "./notifications/notificationManager";

const server = express();

dotenv.config();

//middleware
server.use(cors());
server.use(express.json());
server.use(bodyParserErrorHandler());
server.use(authoriseHeader);

async function main() {
  process.env.TZ = "Australia/Melbourne";
  server.get("/", (req: Request, res: Response) => {
    res.send("Lyf API!");
  });

  // Logger.setLevel(
  //   env.nodeEnv === "prod" ? LoggingLevel.INFO : LoggingLevel.DEBUG
  // );

  new UserEndpoints(server);
  new ItemEndpoints(server);
  new NoteEndpoints(server);

  await db.init();

  const PORT = env.port;

  server.set(
    "trust proxy",
    1 /* number of proxies between user and server (express-rate-limit) */
  );
  server.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`);
  });
}

async function shutdown() {
  // Graceful shutdown
  await notificationManager.cleanup();
  await db.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main();
