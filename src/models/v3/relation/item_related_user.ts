import { EntityGraph, GraphExport } from '../../../api/schema';
import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import {
  ItemUserRelations,
  ItemUserRelationshipDbObject
} from '../../../api/schema/database/items_on_users';
import { UserDbObject } from '../../../api/schema/database/user';
import { ItemRepository } from '../../../repository/entity/item_repository';
import { ItemUserRepository } from '../../../repository/relation/item_user_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class ItemUserRelation extends BaseRelation<UserDbObject, ItemUserRelationshipDbObject> {
  protected logger: Logger = Logger.of(ItemUserRelation);

  protected relationFields: Partial<ItemUserRelations> = {};
  protected relationRepository: ItemUserRepository = new ItemUserRepository();

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
