import { Kysely, PostgresDialect } from 'kysely';
import { Pool, PoolConfig } from 'pg';

import { Database } from '../../../api/schema/database';
import env from '../../../envManager';

const PG_POOL_MAX = 10;

export const DB_DETAILS: PoolConfig = {
  connectionString: env.pgConnectionUrl,
  max: PG_POOL_MAX
};

export const dbPool = new Pool(DB_DETAILS);

export const dialect = new PostgresDialect({
  pool: dbPool
});

export const postgresDb = new Kysely<Database>({
  dialect,
  log: ['query', 'error']
});

export default postgresDb;
