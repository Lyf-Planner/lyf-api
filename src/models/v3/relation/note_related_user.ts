import { EntityGraph, GraphExport } from '../../../api/schema';
import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../../api/schema/database/notes_on_users';
import { UserDbObject } from '../../../api/schema/database/user';
import { NoteUserRepository } from '../../../repository/note_user_repository';
import { UserRepository } from '../../../repository/user_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class NoteUserRelation extends BaseRelation<UserDbObject, NoteUserRelationshipDbObject> {
  protected logger: Logger = Logger.of(NoteUserRelation);

  protected relationFields: Partial<NoteUserRelations> = {};
  protected relationRepository = new NoteUserRepository();

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
