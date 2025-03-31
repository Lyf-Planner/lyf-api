import { ID } from '#/database/abstract';
import { NoteDbObject } from '#/database/notes';
import { NoteUserRelations, NoteUserRelationshipDbObject } from '#/database/notes_on_users';
import { UserRelatedNote } from '#/user';
import { NoteEntity } from '@/models/entity/note_entity';
import { BaseRelation } from '@/models/relation/_base_relation';
import { NoteUserRepository } from '@/repository/relation/note_user_repository';
import { Logger } from '@/utils/logging';
import { ObjectUtils } from '@/utils/object';
import { Includes } from '@/utils/types';

export class UserNoteRelation extends BaseRelation<NoteUserRelationshipDbObject, NoteEntity> {
  protected logger: Logger = Logger.of(UserNoteRelation.name);

  protected relatedEntity: NoteEntity;
  protected repository = new NoteUserRepository();

  static filter(object: Includes<NoteUserRelationshipDbObject>): NoteUserRelationshipDbObject {
    const objectFilter: NoteUserRelationshipDbObject = {
      note_id_fk: object.note_id_fk,
      user_id_fk: object.user_id_fk,
      created: object.created,
      last_updated: object.last_updated,
      invite_pending: object.invite_pending,
      permission: object.permission,
      sorting_rank_preference: object.sorting_rank_preference
    };

    return ObjectUtils.stripUndefinedFields(objectFilter);
  }

  constructor(id: ID, entity_id: ID, object?: NoteUserRelationshipDbObject & NoteDbObject) {
    super(id, entity_id);

    if (object) {
      this.base = UserNoteRelation.filter(object);
      this.relatedEntity = new NoteEntity(entity_id, NoteEntity.filter(object));
    } else {
      this.relatedEntity = new NoteEntity(entity_id);
    }
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._entityId, this._id);
  }

  public async extract(): Promise<NoteDbObject & NoteUserRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as NoteDbObject,
      ...this.base!
    };
  }

  public async export(requestor?: string | undefined): Promise<UserRelatedNote> {
    const relationFields: NoteUserRelations = {
      invite_pending: this.base!.invite_pending,
      permission: this.base!.permission,
      sorting_rank_preference: this.base!.sorting_rank_preference
    }

    return await this.relatedEntity.exportWithPermission(this._id, relationFields);
  }

  public async load(relations?: object): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._entityId, this._id);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserRelatedNote>): Promise<void> {
    const relationFieldUpdates = changes.sorting_rank_preference !== undefined ? {
      // only this field is allowed, the others are social fields and should be handled on those endpoints
      sorting_rank_preference: changes.sorting_rank_preference
    } : {};

    this.changes = relationFieldUpdates;
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };

    const entityUpdates = NoteEntity.filter({
      ...await this.relatedEntity.extract() as NoteDbObject,
      ...changes
    });
    this.relatedEntity.update(entityUpdates);
  }

  public async save(): Promise<void> {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.updateRelation(this._entityId, this._id, this.changes);
    }
  }
}
