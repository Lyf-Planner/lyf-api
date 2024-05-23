import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import { ItemUserRelations } from '../../../api/schema/database/items_on_users';
import { NoteDbObject } from '../../../api/schema/database/notes';
import { NoteUserRelations, NoteUserRelationshipDbObject } from '../../../api/schema/database/notes_on_users';
import { Note } from '../../../api/schema/notes';
import { UserRelatedNote } from '../../../api/schema/user';
import { NoteRepository } from '../../../repository/entity/note_repository';
import { NoteUserRepository } from '../../../repository/relation/note_user_repository';
import { Logger } from '../../../utils/logging';
import { NoteEntity } from '../entity/note_entity';
import { BaseRelation } from './base_relation';

export class UserNoteRelation extends BaseRelation<NoteUserRelationshipDbObject, NoteDbObject> {
  protected logger: Logger = Logger.of(UserNoteRelation);

  protected relatedEntity: NoteEntity;
  protected repository = new NoteUserRepository();

  constructor(id: ID, entity_id: ID) {
    super(id, entity_id);
    this.relatedEntity = new NoteEntity(entity_id);
  }

  static filter(object: any): NoteUserRelations {
    return {
      invite_pending: object.invite_pending,
      permission: object.status
    }
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._entityId, this._id);
  }

  public async extract(): Promise<NoteDbObject & NoteUserRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as NoteDbObject,
      ...this.base!
    }
  }

  public async export(requestor?: string | undefined): Promise<UserRelatedNote> {
    return {
      ...await this.relatedEntity.export(this._id, true) as Note,
      ...UserNoteRelation.filter(this.base!)
    }
  }

  public async load(relations: object): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._entityId, this._id);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<UserRelatedNote>): Promise<void> {
    const relationFieldUpdates = UserNoteRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    }
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._entityId, this._id, this.base!);
  }
}
