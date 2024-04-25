import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import express from 'express';
import bodyParserErrorHandler from 'express-body-parser-error-handler';

import { ItemEndpoints } from './controller/endpoints/itemEndpoints';
import { NoteEndpoints } from './controller/endpoints/noteEndpoints';
import { UserEndpoints } from './controller/endpoints/userEndpoints';
import { authoriseHeader } from './controller/middleware/authMiddleware';
import env from './envManager';
import notificationService from './services/notifications/notification_service';
import mongoDb from './repository/db/mongo/mongo_db';
import { migrateToLatest } from './repository/db/pg/migration_manager';
import postgresDb from './repository/db/pg/postgres_db';
import { Logger, LoggingLevel } from './utils/logging';

export const server = express();

dotenv.config();

Logger.setLevel(LoggingLevel.DEBUG);

process.env.TZ = 'Australia/Melbourne';

// middleware
server.use(cors());
server.use(express.json());
server.use(bodyParserErrorHandler());
server.use(authoriseHeader);

server.get('/', (req: Request, res: Response) => {
  res.send('Lyf API!');
});

const PORT = env.port;

server.set('trust proxy', 1 /* number of proxies between user and server (express-rate-limit) */);

export const serverInitialised = new Promise(async (resolve, reject) => {
  try {
    // Initialise endpoints
    new UserEndpoints(server);
    new ItemEndpoints(server);
    new NoteEndpoints(server);

    // Initialise services
    await mongoDb.init();
    await notificationService.init();
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
  await notificationService.cleanup();
  await mongoDb.close();
  await postgresDb.destroy();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
