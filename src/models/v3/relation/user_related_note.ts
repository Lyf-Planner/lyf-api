import { EntityGraph, GraphExport } from '../../../api/schema';
import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ItemUserRelations } from '../../../api/schema/database/items_on_users';
import { NoteDbObject } from '../../../api/schema/database/notes';
import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../../api/schema/database/notes_on_users';
import { UserRelatedNote } from '../../../api/schema/user';
import { ItemUserRepository } from '../../../repository/item_user_repository';
import { NoteRepository } from '../../../repository/note_repository';
import { NoteUserRepository } from '../../../repository/note_user_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class UserNoteRelation extends BaseRelation<NoteDbObject, NoteUserRelationshipDbObject> {
  protected logger: Logger = Logger.of(UserNoteRelation);

  protected relationFields: Partial<ItemUserRelations> = {};
  protected relationRepository = new NoteUserRepository();

  protected repository = new NoteRepository();

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
