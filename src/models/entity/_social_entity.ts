import { ItemDbObject } from '#/database/items';
import { NoteDbObject } from '#/database/notes';
import { BaseEntity, EntityRelations } from '@/models/entity/_base_entity';
import { ItemUserRelation } from '@/models/relation/item_related_user';
import { NoteUserRelation } from '@/models/relation/note_related_user';

export type SocialRelations = {
  users: SocialRelation;
};

export type SocialRelation = NoteUserRelation|ItemUserRelation;

export type SocialEntityObject = ItemDbObject|NoteDbObject;

export abstract class SocialEntity<T extends SocialEntityObject> extends BaseEntity<T> {
  public abstract getRelations(): EntityRelations;

  async getUsers() {
    await this.fetchRelations('users');
    await this.load();
    const itemUsers = this.getRelations().users as ItemUserRelation[]|NoteUserRelation[];
    return itemUsers.map((x) => x.getRelatedEntity());
  }
}
