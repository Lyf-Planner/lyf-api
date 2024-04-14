import { Request, Response } from 'express';
import { UserEndpoints } from './controller/endpoints/userEndpoints';
import { ItemEndpoints } from './controller/endpoints/itemEndpoints';
import { NoteEndpoints } from './controller/endpoints/noteEndpoints';
import { authoriseHeader } from './controller/middleware/authMiddleware';
import { Logger, LoggingLevel } from './utils/logging';
import db from './repository/db/mongo/mongoDb';
import notificationManager from './models/notifications/notificationManager';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import env from './envManager';
import bodyParserErrorHandler from 'express-body-parser-error-handler';
import { migrateToLatest } from './repository/db/pg/migrationManager';

export const server = express();

dotenv.config();

Logger.setLevel(LoggingLevel.DEBUG);

process.env.TZ = 'Australia/Melbourne';

//middleware
server.use(cors());
server.use(express.json());
server.use(bodyParserErrorHandler());
server.use(authoriseHeader);

server.get('/', (req: Request, res: Response) => {
  res.send('Lyf API!');
});

new UserEndpoints(server);
new ItemEndpoints(server);
new NoteEndpoints(server);

const PORT = env.port;

server.set('trust proxy', 1 /* number of proxies between user and server (express-rate-limit) */);

export const serverInitialised = new Promise(async (resolve, reject) => {
  try {
    await db.init();
    await notificationManager.init();
    await migrateToLatest();
    resolve(true);
  } catch (err) {
    reject(err);
  }
});

const startServer = async () => {
  if (env.nodeEnv !== 'test') {
    await serverInitialised;
    server.listen(PORT, () => {
      console.log(`server started at http://localhost:${PORT}`);
    });
  }
};

// Graceful shutdown
export async function shutdown() {
  await notificationManager.cleanup();
  await db.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
