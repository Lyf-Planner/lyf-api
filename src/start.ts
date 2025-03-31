import cors from 'cors';
import { Request, Response } from 'express';
import express from 'express';
import bodyParserErrorHandler from 'express-body-parser-error-handler';

import { authoriseHeader } from '@/controller/middleware/auth_middleware';
import { ItemEndpoints } from '@/controller/routes/item_routes';
import { NoteEndpoints } from '@/controller/routes/note_routes';
import { PublicEndpoints } from '@/controller/routes/public_routes';
import { UserEndpoints } from '@/controller/routes/user_routes';
import { migrateDatabase } from '@/db/migration_manager';
import postgresDb from '@/db/pg/postgres_db';
import env from '@/envManager';
import reminderService from '@/modules/notification_scheduling/reminder_service';
import { Logger } from '@/utils/logging';

export const server = express();
const log = new Logger('start');

// middleware
server.use(cors());
server.use(express.json());
server.use(bodyParserErrorHandler());
server.use(authoriseHeader);

server.get('/', (req: Request, res: Response) => {
  res.send('Lyf API!');
});

/* number of proxies between user and server (express-rate-limit) */
server.set('trust proxy', 1);

export const serverInitialisedPromise = new Promise((resolve, reject) => {
  try {
    // Initialise endpoints
    new PublicEndpoints(server);
    new UserEndpoints(server);
    new ItemEndpoints(server);
    new NoteEndpoints(server);

    // Initialise services
    Promise.all([
      reminderService.init(),
      migrateDatabase()
    ])
      .then(resolve)
      .catch(reject);
  } catch (error) {
    reject(error);
  }
});

const startServer = async () => {
  await serverInitialisedPromise;
  server.listen(env.port, () => {
    log.info(`server started with ${env.nodeEnv} environment at http://localhost:${env.port}`);
  });
};

export async function shutdownGracefully() {
  await Promise.all([
    reminderService.cleanup(),
    postgresDb.destroy()
  ]);
  process.exit(0);
}

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);

// Entrypoint
if (env.nodeEnv !== 'test') {
  startServer();
}
