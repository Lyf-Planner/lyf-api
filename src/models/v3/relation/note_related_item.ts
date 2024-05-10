import { EntityGraph, GraphExport } from '../../../api/schema';
import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ItemDbObject } from '../../../api/schema/database/items';
import {
  ItemNoteRelations,
  ItemNoteRelationshipDbObject
} from '../../../api/schema/database/items_on_notes';
import { ItemRepository } from '../../../repository/entity/item_repository';
import { ItemNoteRepository } from '../../../repository/relation/item_note_repository';
import { Logger } from '../../../utils/logging';
import { BaseRelation } from './base_relation';

export class NoteItemRelation extends BaseRelation<ItemDbObject, ItemNoteRelationshipDbObject> {
  protected logger: Logger = Logger.of(NoteItemRelation);

  protected relationFields: Partial<ItemNoteRelations> = {};
  protected relationRepository = new ItemNoteRepository();

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
