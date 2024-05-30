import { ItemDbObject } from '../../api/schema/database/items';
import { NoteDbObject } from '../../api/schema/database/notes';
import { ItemUserRelation } from '../relation/item_related_user';
import { NoteUserRelation } from '../relation/note_related_user';
import { BaseEntity } from './_base_entity';

export type SocialRelations = {
  users: SocialRelation;
};

export type SocialRelation = NoteUserRelation|ItemUserRelation;

export type SocialEntityObject =  ItemDbObject|NoteDbObject;

export abstract class SocialEntity<T extends SocialEntityObject> extends BaseEntity<T> {
  async getUsers() {
    await this.fetchRelations('users');
    await this.load();
    const itemUsers = this.getRelations().users as ItemUserRelation[]|NoteUserRelation[];
    return itemUsers.map((x) => x.getRelatedEntity());
  }
}
