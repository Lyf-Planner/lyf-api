import { EntityGraph, GraphExport } from '../../../api/schema';
import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { UserDbObject } from '../../../api/schema/database/user';
import {
  UserFriendshipDbObject,
  UserFriendshipRelations
} from '../../../api/schema/database/user_friendships';
import { UserRepository } from '../../../repository/entity/user_repository';
import { UserFriendshipRepository } from '../../../repository/relation/user_friendship_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class UserFriendRelation extends BaseRelation<UserDbObject, UserFriendshipDbObject> {
  protected logger: Logger = Logger.of(UserFriendRelation);

  protected relationFields: Partial<UserFriendshipRelations> = {};
  protected relationRepository = new UserFriendshipRepository();

  protected repository = new UserRepository();

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
