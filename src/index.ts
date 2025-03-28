import cors from 'cors';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import express from 'express';
import bodyParserErrorHandler from 'express-body-parser-error-handler';

import { authoriseHeader } from './controller/middleware/auth_middleware';
import { ItemEndpoints } from './controller/routes/item_routes';
import { NoteEndpoints } from './controller/routes/note_routes';
import { PublicEndpoints } from './controller/routes/public_routes';
import { UserEndpoints } from './controller/routes/user_routes';
import { migrateDatabase } from './db/migration_manager';
import mongoDb from './db/mongo/mongo_db';
import postgresDb from './db/pg/postgres_db';
import env from './envManager';
import reminderService from './modules/notification_scheduling/reminder_service';
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

export const serverInitialised = new Promise((resolve, reject) => {
  try {
    // Initialise endpoints
    new PublicEndpoints(server);
    new UserEndpoints(server);
    new ItemEndpoints(server);
    new NoteEndpoints(server);

    // Initialise services
    Promise.all([
      mongoDb.init(),
      reminderService.init(),
      migrateDatabase()
    ])
      .then(() => resolve(true))
      .catch((error) => {
        throw new Error(error);
      });
  } catch (err) {
    reject(err);
  }
});

const startServer = async () => {
  if (env.nodeEnv !== 'test') {
    await serverInitialised;
    server.listen(PORT, () => {
      console.log(`server started in ${env.nodeEnv} env at http://localhost:${PORT}`);
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
