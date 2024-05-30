import { Kysely, PostgresDialect } from 'kysely';
import { Pool, PoolConfig } from 'pg';

import { Database } from '../../api/schema/database';
import env from '../../envManager';
import { Logger } from '../../utils/logging';

const PG_POOL_MAX = 10;
const logger = new Logger('PostgresDb')

export const DB_DETAILS: PoolConfig = {
  connectionString: env.pgConnectionUrl,
  max: PG_POOL_MAX
};

logger.info("Initialising dbPool connection")

export const dbPool = new Pool(DB_DETAILS);

logger.info("Initialising Kysely dialect")

export const dialect = new PostgresDialect({
  pool: dbPool
});

logger.info("Initialising Kysely Postgres interface")

export const postgresDb = new Kysely<Database>({
  dialect,
  log: ['query', 'error']
});

logger.info("Kysely PostgresDb initialised!")

export default postgresDb;
