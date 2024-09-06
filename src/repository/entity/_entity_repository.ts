import { DatabaseEntities, DbEntityObject } from '../../types/schema/database';
import { ID } from '../../types/schema/database/abstract';
import { LyfError } from '../../utils/lyf_error';
import { BaseRepository } from '../_base_repository';

export abstract class EntityRepository<T extends DbEntityObject> extends BaseRepository<T> {
  public readonly pk = 'id';

  constructor(table_name: keyof DatabaseEntities) {
    super(table_name);
  }

  async delete(id: ID): Promise<boolean> {
    const deleteResult = await this.db.deleteFrom(this.table_name).where(this.pk, '=', id).execute();

    return deleteResult.length > 0;
  }

  async findById(id: ID): Promise<T | undefined> {
    return (await this.db
      .selectFrom(this.table_name)
      .selectAll()
      .where(this.pk, '=', id)
      .executeTakeFirst()) as T | undefined;
  }

  async update(id: ID, object: Partial<T>): Promise<T | undefined> {
    const [updated] = await this.db
      .updateTable(this.table_name)
      .set({
        ...object,
        last_updated: new Date()
      })
      .where(this.pk, '=', id)
      .returningAll()
      .execute();

    if (!updated) {
      throw new LyfError(`Did not find db object ${id} to update in ${this.table_name}`, 404);
    }
    
    return updated as T;
  }
}
