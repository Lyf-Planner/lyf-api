import { Database } from '../api/schema/database';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import env from '../envManager';

const PG_POOL_MAX = 10;
const PG_PORT = 5432;

const dialect = new PostgresDialect({
  pool: new Pool({
    database: env.pgDb,
    host: env.pgHost,
    user: env.pgUsername,
    password: env.pgPassword,
    port: PG_PORT,
    max: PG_POOL_MAX
  })
});

export const db = new Kysely<Database>({
  dialect
});
