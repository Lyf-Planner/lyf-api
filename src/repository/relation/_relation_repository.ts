
import { DbPrimaryKey, DbRelationObject } from '#/database';
import { ID } from '#/database/abstract';
import { BaseRepository } from '@/repository/_base_repository';

export abstract class RelationRepository<T extends DbRelationObject> extends BaseRepository<T> {
  // These are instantiated in lexicographical order.
  protected abstract readonly pk_a: DbPrimaryKey;
  protected abstract readonly pk_b: DbPrimaryKey;

  // These have their own implementation so we don't mess up the order of pks submitted as args
  protected abstract deleteRelation(...args: unknown[]): Promise<void>;

  async findByCompositeId(id_a: ID, id_b: ID): Promise<T | undefined> {
    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_a, '=', id_a)
      .where(this.pk_b, '=', id_b)
      .executeTakeFirst();

    return result as T|undefined;
  }

  async findRelationsByIdA(id_a: ID): Promise<T[]> {
    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_a, '=', id_a)
      .execute();

    return result as T[];
  }

  async findRelationsByIdB(id_b: ID): Promise<T[]> {
    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_b, '=', id_b)
      .execute();

    return result as T[];
  }
}
