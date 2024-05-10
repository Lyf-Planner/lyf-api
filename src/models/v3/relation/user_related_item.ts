import { EntityGraph, GraphExport } from '../../../api/schema';
import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ItemDbObject } from '../../../api/schema/database/items';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../../api/schema/database/items_on_users';
import { UserRelatedItem } from '../../../api/schema/user';
import { ItemRepository } from '../../../repository/item_repository';
import { ItemUserRepository } from '../../../repository/item_user_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class UserItemRelation extends BaseRelation<ItemDbObject, ItemUserRelationshipDbObject> {
  protected logger: Logger = Logger.of(UserItemRelation);

  protected relationFields: Partial<ItemUserRelations> = {};
  protected relationRepository = new ItemUserRepository();

  protected repository = new ItemRepository();

  protected checkRelationFieldUpdates(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  protected deleteRelation(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public export(requestor?: string | undefined): Promise<GraphExport> {
    throw new Error('Method not implemented.');
  }

  protected extractRelationFields(db_relation_object: DbRelationObject): Promise<DbRelationFields> {
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
}
