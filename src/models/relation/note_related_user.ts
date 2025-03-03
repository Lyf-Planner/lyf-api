import { DbRelationFields, DbRelationObject } from '../../../schema/database';
import { ID } from '../../../schema/database/abstract';
import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../../schema/database/notes_on_users';
import { UserDbObject } from '../../../schema/database/user';
import { NoteRelatedUser } from '../../../schema/notes';
import { PublicUser } from '../../../schema/user';
import { NoteUserRepository } from '../../repository/relation/note_user_repository';
import { Logger } from '../../utils/logging';
import { ObjectUtils } from '../../utils/object';
import { NoteEntity } from '../entity/note_entity';
import { UserEntity } from '../entity/user_entity';
import { SocialRelation } from './_social_relation';

export class NoteUserRelation extends SocialRelation<NoteUserRelationshipDbObject, UserEntity> {
  protected logger: Logger = Logger.of(NoteUserRelation);

  protected relatedEntity: UserEntity;
  protected repository = new NoteUserRepository();

  static filter(object: any): NoteUserRelationshipDbObject {
    const objectFilter: Required<NoteUserRelationshipDbObject> = {
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

  constructor(id: ID, entity_id: ID, object?: NoteUserRelationshipDbObject & UserDbObject) {
    super(id, entity_id);

    if (object) {
      this.base = NoteUserRelation.filter(object);
      this.relatedEntity = new UserEntity(entity_id, UserEntity.filter(object));
    } else {
      this.relatedEntity = new UserEntity(entity_id);
    }

  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._id, this._entityId);
  }

  public async extract(): Promise<UserDbObject & NoteUserRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as UserDbObject,
      ...this.base!
    };
  }

  public async export(requestor?: string | undefined): Promise<NoteRelatedUser> {
    const relationFields: NoteUserRelations = {
      invite_pending: this.base!.invite_pending,
      permission: this.base!.permission,
      sorting_rank_preference: this.base!.sorting_rank_preference
    }

    return {
      ...await this.relatedEntity.export('', false) as PublicUser,
      ...relationFields
    };
  }

  public async load(): Promise<void> {
    const userRelation = await NoteEntity.getPermission(this._id, this._entityId)
    if (!userRelation) {
      return;
    }

    this.base = userRelation;
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<NoteRelatedUser>): Promise<void> {
    const relationFieldUpdates = NoteUserRelation.filter(changes);

    this.changes = relationFieldUpdates;
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    };
  }

  public async save(): Promise<void> {
    if (!ObjectUtils.isEmpty(this.changes)) {
      await this.repository.updateRelation(this._id, this._entityId, this.changes);
    }
  }
}
