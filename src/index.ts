import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import express from 'express';
import bodyParserErrorHandler from 'express-body-parser-error-handler';

import { ItemEndpoints } from './controller/routes/item_routes';
import { NoteEndpoints } from './controller/routes/note_routes';
import { UserEndpoints } from './controller/routes/user_routes';
import { authoriseHeader } from './controller/middleware/auth_middleware';
import mongoDb from './db/mongo/mongo_db';
import { migrateToLatest } from './db/pg/migration_manager';
import postgresDb from './db/pg/postgres_db';
import env from './envManager';
import reminderService from './services/notifications/reminder_service';
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
    // await mongoDb.init();
    // await reminderService.init();
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
  await reminderService.cleanup();
  await mongoDb.close();
  await postgresDb.destroy();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
