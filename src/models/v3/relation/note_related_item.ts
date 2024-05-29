import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { ItemDbObject } from '../../../api/schema/database/items';
import {
  ItemNoteRelations,
  ItemNoteRelationshipDbObject
} from '../../../api/schema/database/items_on_notes';
import { NoteRelatedItem } from '../../../api/schema/notes';
import { ItemNoteRepository } from '../../../repository/relation/item_note_repository';
import { Logger } from '../../../utils/logging';
import { ItemEntity } from '../entity/item_entity';
import { BaseRelation } from './_base_relation';

export class NoteItemRelation extends BaseRelation<ItemNoteRelationshipDbObject, ItemEntity> {
  protected logger: Logger = Logger.of(NoteItemRelation);

  protected relatedEntity: ItemEntity;
  protected repository = new ItemNoteRepository();

  constructor(id: ID, entity_id: ID) {
    super(id, entity_id);
    this.relatedEntity = new ItemEntity(entity_id);
  }

  static filter(object: any): ItemNoteRelations {
    return {}
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._entityId, this._id);
  }

  public async extract(): Promise<ItemDbObject & ItemNoteRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as ItemDbObject,
      ...this.base!
    }
  }

  public async export(requestor?: string | undefined): Promise<NoteRelatedItem> {
    return {
      ...await this.relatedEntity.export("", false) as ItemDbObject,
      ...NoteItemRelation.filter(this.base!)
    }
  }

  public async load(relations: object): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._entityId, this._id);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<NoteRelatedItem>): Promise<void> {
    const relationFieldUpdates = NoteItemRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    }
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._entityId, this._id, this.base!)
  }
}
