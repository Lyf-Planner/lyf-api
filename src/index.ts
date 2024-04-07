import { Request, Response } from "express";
import { UserEndpoints } from "./controller/endpoints/userEndpoints";
import { ItemEndpoints } from "./controller/endpoints/itemEndpoints";
import { NoteEndpoints } from "./controller/endpoints/noteEndpoints";
import { authoriseHeader } from "./controller/middleware/authMiddleware";
import { Logger, LoggingLevel } from "./utils/logging";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import env from "./envManager";
import bodyParserErrorHandler from "express-body-parser-error-handler";
import db from "./repository/mongoDb";
import notificationManager from "./models/notifications/notificationManager";

export const server = express();

dotenv.config();

//middleware
server.use(cors());
server.use(express.json());
server.use(bodyParserErrorHandler());
server.use(authoriseHeader);

export async function main() {
  Logger.setLevel(LoggingLevel.DEBUG);

  process.env.TZ = "Australia/Melbourne";

  server.get("/", (req: Request, res: Response) => {
    res.send("Lyf API!");
  });

  new UserEndpoints(server);
  new ItemEndpoints(server);
  new NoteEndpoints(server);

  await db.init();
  await notificationManager.init();

  const PORT = env.port;

  server.set(
    "trust proxy",
    1 /* number of proxies between user and server (express-rate-limit) */
  );

  if (env.nodeEnv !== "test") {
    server.listen(PORT, () => {
      console.log(`server started at http://localhost:${PORT}`);
    });
  }
}

// Graceful shutdown
export async function shutdown() {
  await notificationManager.cleanup();
  await db.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

main();
