import { DbRelationFields, DbRelationObject } from '../../types/schema/database';
import { ID } from '../../types/schema/database/abstract';
import { ItemUserRelations } from '../../types/schema/database/items_on_users';
import { NoteDbObject } from '../../types/schema/database/notes';
import { NoteUserRelations, NoteUserRelationshipDbObject } from '../../types/schema/database/notes_on_users';
import { Note } from '../../types/schema/notes';
import { UserRelatedNote } from '../../types/schema/user';
import { NoteRepository } from '../../repository/entity/note_repository';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { Logger } from '../../utils/logging';
import { ObjectUtils } from '../../utils/object';
import { NoteEntity } from '../entity/note_entity';
import { BaseRelation } from './_base_relation';

export class UserNoteRelation extends BaseRelation<NoteUserRelationshipDbObject, NoteEntity> {
  protected logger: Logger = Logger.of(UserNoteRelation);

  protected relatedEntity: NoteEntity;
  protected repository = new NoteUserRepository();

  static filter(object: any): NoteUserRelationshipDbObject {
    const objectFilter: Required<NoteUserRelationshipDbObject> = {
      note_id_fk: object.note_id_fk,
      user_id_fk: object.user_id_fk,
      created: object.created,
      last_updated: object.last_updated,
      invite_pending: object.invite_pending,
      permission: object.permission
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
      permission: this.base!.permission
    }

    return {
      ...await this.relatedEntity.export(undefined, true) as Note,
      ...relationFields
    };
  }

  public async load(relations: object): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._entityId, this._id);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserRelatedNote>): Promise<void> {
    const relationFieldUpdates = UserNoteRelation.filter(changes);
    const entityUpdates = NoteEntity.filter(changes);

    this.changes = relationFieldUpdates;
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };
    this.relatedEntity.update(entityUpdates);
  }

  public async save(): Promise<void> {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.updateRelation(this._entityId, this._id, this.changes);
    }
  }
}
