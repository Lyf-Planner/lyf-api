import { Kysely } from 'kysely';

import { ID } from '../api/schema/database/abstract';
import { Database, DbObject } from '../api/schema/database';
import postgresDb from './db/pg/postgres_db';

const DEFAULT_PK = 'id';

/**
 * Generic repository base class for basic CRUD operations.
 * T defines the table row type.
 */
export abstract class BaseRepository<T extends DbObject> {
  protected db: Kysely<Database>;
  protected tableName: keyof Database;

  constructor(tableName: keyof Database) {
    this.db = postgresDb;
    this.tableName = tableName;
  }

  async findAll(): Promise<T[]> {
    return (await this.db.selectFrom(this.tableName).selectAll().execute()) as T[];
  }

  async findById(id: ID): Promise<T | undefined> {
    return (await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where(DEFAULT_PK, '=', id)
      .executeTakeFirst()) as T | undefined;
  }

  async create(object: DbObject): Promise<T> {
    const [created] = await this.db
      .insertInto(this.tableName)
      .values(object)
      .returningAll()
      .execute();
    return created as T;
  }

  async update(id: ID, object: Partial<DbObject>): Promise<T | undefined> {
    const [updated] = await this.db
      .updateTable(this.tableName)
      .set(object)
      .where(DEFAULT_PK, '=', id)
      .returningAll()
      .execute();
    return updated as T;
  }

  async delete(id: ID): Promise<boolean> {
    const deleteResult = await this.db
      .deleteFrom(this.tableName)
      .where(DEFAULT_PK, '=', id)
      .execute();

    return deleteResult.length > 0;
  }
}
