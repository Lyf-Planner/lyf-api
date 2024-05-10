import { GraphExport, EntityGraph } from '../../../api/schema';
import { DbRelationFields, DbObject, DbRelationObject } from '../../../api/schema/database';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../../api/schema/database/items_on_users';
import { UserDbObject } from '../../../api/schema/database/user';
import { ItemRelatedUser } from '../../../api/schema/items';
import { BaseRepository } from '../../../repository/base_repository';
import { ItemUserRepository } from '../../../repository/item_user_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class ItemUserRelation extends BaseRelation<ItemRelatedUser> {
  protected logger: Logger = Logger.of(ItemUserRelation);
  protected relationFields: ItemUserRelations;
  protected relationRepository: ItemUserRepository;

  protected extractRelationFields(db_relation_object: DbRelationObject): Promise<DbRelationFields> {
    throw new Error('Method not implemented.');
  }
  protected checkRelationFieldUpdates(): Promise<void> {
    throw new Error('Method not implemented.');
  }
 
  public delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public export(requestor?: string | undefined): Promise<GraphExport> {
    throw new Error('Method not implemented.');
  }
  public load(relations: object): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public update(changes: Partial<EntityGraph>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected save(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  protected parse(combined_db_object: UserDbObject & ItemUserRelationshipDbObject) {
    const { user_id_fk, item_id_fk, ...parsed } = combined_db_object;
    return parsed;
  }
}
