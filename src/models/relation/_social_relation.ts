import { ItemUserRelationshipDbObject } from '#/database/items_on_users';
import { NoteUserRelationshipDbObject } from '#/database/notes_on_users';
import { UserEntity } from '@/models/entity/user_entity';
import { BaseRelation } from '@/models/relation/_base_relation';

export type SocialRelationObject = NoteUserRelationshipDbObject|ItemUserRelationshipDbObject;

export abstract class SocialRelation<
  T extends SocialRelationObject,
  K extends UserEntity
> extends BaseRelation<T, K> {
  invited() {
    return this.base!.invite_pending;
  }

  permission() {
    return this.base!.permission;
  }
}
