import { Database } from '../api/schema/database';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

const dialect = new PostgresDialect({
  pool: new Pool({
    database: 'test',
    host: 'localhost',
    user: 'admin',
    port: 5434,
    max: 10
  })
});

export const db = new Kysely<Database>({
  dialect
});
