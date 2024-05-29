import { DbRelationFields, DbRelationObject } from '../../../api/schema/database';
import { ID } from '../../../api/schema/database/abstract';
import {
  NoteUserRelations,
  NoteUserRelationshipDbObject
} from '../../../api/schema/database/notes_on_users';
import { UserDbObject } from '../../../api/schema/database/user';
import { NoteRelatedUser } from '../../../api/schema/notes';
import { PublicUser } from '../../../api/schema/user';
import { NoteUserRepository } from '../../../repository/relation/note_user_repository';
import { Logger } from '../../../utils/logging';
import { UserEntity } from '../entity/user_entity';
import { SocialRelation } from './_social_relation';

export class NoteUserRelation extends SocialRelation<NoteUserRelationshipDbObject, UserEntity> {
  protected logger: Logger = Logger.of(NoteUserRelation);

  protected relatedEntity: UserEntity;
  protected repository = new NoteUserRepository();

  constructor(id: ID, entity_id: ID) {
    super(id, entity_id);
    this.relatedEntity = new UserEntity(entity_id);
  }

  static filter(object: any): NoteUserRelations {
    return {
      invite_pending: object.invite_pending,
      permission: object.status
    }
  }

  public async delete(): Promise<void> {
    await this.repository.deleteRelation(this._id, this._entityId);
  }

  public async extract(): Promise<UserDbObject & NoteUserRelationshipDbObject> {
    return {
      ...await this.relatedEntity.extract(false) as UserDbObject,
      ...this.base!
    }
  }

  public async export(requestor?: string | undefined): Promise<NoteRelatedUser> {
    return {
      ...await this.relatedEntity.export("", false) as PublicUser,
      ...NoteUserRelation.filter(this.base!)
    }
  }

  public async load(): Promise<void> {
    this.base = await this.repository.findByCompositeId(this._id, this._entityId);
    await this.relatedEntity.load();
  }

  public async update(changes: Partial<NoteRelatedUser>): Promise<void> {
    const relationFieldUpdates = NoteUserRelation.filter(changes);
    this.base = {
      ...this.base!,
      ...relationFieldUpdates
    }
  }

  public async save(): Promise<void> {
    await this.repository.updateRelation(this._id, this._entityId, this.base!);
  }
}
