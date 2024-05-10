import { DbPrimaryKey, DbRelationObject } from '../../api/schema/database';
import { ID } from '../../api/schema/database/abstract';
import { BaseRepository } from '../_base_repository';

export abstract class RelationRepository<T extends DbRelationObject> extends BaseRepository<T> {
  // These are instantiated in lexicographical order.
  protected abstract readonly pk_a: DbPrimaryKey;
  protected abstract readonly pk_b: DbPrimaryKey;

  // These should be ordered in a way that corresponds to the naming order of the table,
  // Example: items_on_users => id_a is for item, id_b is for user.
  //
  // In the case of many to many relations they should be ordered lexicographically.
  public async deleteRelation(id_a: ID, id_b: ID) {
    const deleteResult = await this.db
      .deleteFrom(this.table_name)
      .where(this.pk_a, '=', id_a)
      .where(this.pk_b, '=', id_b)
      .execute();

    return deleteResult.length > 0;
  }

  async findByCompositeId(id_a: ID, id_b: ID): Promise<T | undefined> {
    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_a, '=', id_a)
      .where(this.pk_b, '=', id_b)
      .executeTakeFirst();

    return result as T | undefined;
  }

  async findRelationsByIdA(id_a: ID): Promise<T[] | undefined> {
    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_a, '=', id_a)
      .execute();

    return result as T[] | undefined;
  }

  async findRelationsByIdB(id_b: ID): Promise<T[] | undefined> {
    const result = await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk_b, '=', id_b)
      .execute();

    return result as T[] | undefined;
  }
}
