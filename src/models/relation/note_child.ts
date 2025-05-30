
import { ID } from '#/database/abstract';
import { NoteChildDbObject } from '#/database/note_children';
import { NoteDbObject } from '#/database/notes';
import { ChildNote } from '#/notes';
import { UserRelatedNote } from '#/user';
import { NoteEntity } from '@/models/entity/note_entity';
import { BaseRelation } from '@/models/relation/_base_relation';
import { NoteChildRepository } from '@/repository/relation/note_child_repository';
import { Logger } from '@/utils/logging';
import { ObjectUtils } from '@/utils/object';
import { Includes } from '@/utils/types';

export class NoteChildRelation extends BaseRelation<NoteChildDbObject, NoteEntity> {
  protected logger: Logger = Logger.of(NoteChildRelation.name);

  // the child note is treated as the relatedEntity - they are the target in this tables context
  protected relatedEntity: NoteEntity;
  protected repository = new NoteChildRepository();

  static filter(object: Includes<NoteChildDbObject>): NoteChildDbObject {
    const objectFilter: Required<NoteChildDbObject> = {
      parent_id: object.parent_id,
      child_id: object.child_id,
      created: object.created,
      last_updated: object.last_updated,
      distance: object.distance,
      sorting_rank: object.sorting_rank
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  constructor(parent_id: ID, child_id: ID, object?: NoteChildDbObject & NoteDbObject) {
    super(parent_id, child_id);

    if (object) {
      this.base = NoteChildRelation.filter(object);
      this.relatedEntity = new NoteEntity(child_id, NoteEntity.filter(object));
    } else {
      this.relatedEntity = new NoteEntity(child_id);
    }
  }

  async create(db_object: NoteChildDbObject) {
    const validatedObj = NoteChildRelation.filter(db_object);

    const uploaded = await this.repository.create(validatedObj);
    this.base = uploaded;

    // find all ancestors of the parent to also create the child relation with
    // this is how we improve query times for hierarchical permissions
    const ancestors = await this.repository.findAncestors(validatedObj.parent_id);

    let ancestorDistance = 1;
    for (const ancestor of ancestors) {
      ancestorDistance += 1;
      await this.repository.create({
        ...ancestor,
        distance: ancestorDistance,
        child_id: validatedObj.child_id
      });
    }
  }

  async delete(): Promise<void> {
    await this.repository.deleteRelation(this._entityId, this._id);
  }

  async extractBase(): Promise<NoteChildDbObject> {
    return {
      ...this.base as NoteChildDbObject
    };
  }

  async extract(): Promise<NoteChildDbObject & NoteDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as NoteDbObject,
      ...this.base as NoteChildDbObject
    };
  }

  async exportWithPermission(requestor: ID): Promise<UserRelatedNote> {
    return await this.relatedEntity.exportWithPermission(requestor);
  }

  async export(requestor: string): Promise<ChildNote> {
    const relationFields = {
      parent_id: this.base!.parent_id,
      sorting_rank: this.base!.sorting_rank
    }

    // we don't exportWithPermission here, because a NoteChild will always be loaded from a NoteEntity
    // in turn the NoteEntity will always be the one checking permission, such that permission to the child is implied
    return {
      ...await this.relatedEntity.export(requestor, false) as NoteDbObject,
      ...relationFields
    };
  }

  async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  async update(changes: Partial<ChildNote>): Promise<void> {
    const updatedBase = NoteChildRelation.filter({
      ...this.base!,
      ...changes
    });

    this.changes = updatedBase;
    this.base = updatedBase;
  }

  async save(): Promise<void> {
    await this.repository.updateRelation(this._entityId, this._id, this.base!)
  }

  parent_id() {
    return this.base!.parent_id;
  }

  child_id() {
    return this.base!.child_id
  }
}
