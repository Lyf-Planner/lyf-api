import { Kysely } from 'kysely';

import { Database, DbObject } from '../types/schema/database';
import postgresDb from '../db/pg/postgres_db';

/**
 * Generic repository base class for basic CRUD operations.
 * T defines the table schema.
 */
export abstract class BaseRepository<T extends DbObject> {
  protected readonly db: Kysely<Database> = postgresDb;
  public readonly table_name: keyof Database;

  constructor(table_name: keyof Database) {
    this.table_name = table_name;
  }

  async findAll(): Promise<T[]> {
    return (await this.db.selectFrom(this.table_name).selectAll().execute()) as T[];
  }

  async create(object: DbObject): Promise<T> {
    const [created] = await this.db
      .insertInto(this.table_name)
      .values(object)
      .returningAll()
      .execute();

    // Using "as T" here and in other places isn't ideal,
    // but because we declare tableName as "keyof Database",
    // Kysely cannot infer the return type.
    //
    // A solution probably exists and would be great to find,
    // But for the moment this is the trade-off of abstraction.
    return created as T;
  }
}
