import { EntitySubgraph } from '../../../api/schema';
import { NoteDbObject } from '../../../api/schema/database/notes';
import { UserID } from '../../../api/schema/database/user';
import { Note, NoteRelatedItem, NoteRelatedUser, NoteRelations } from '../../../api/schema/notes';
import { NoteRepository } from '../../../repository/note_repository';
import { Logger } from '../../../utils/logging';
import { LyfError } from '../../../utils/lyf_error';
import { CommandType } from '../command_types';
import { NoteItemRelation } from '../relation/note_related_item';
import { NoteUserRelation } from '../relation/note_related_user';
import { BaseEntity } from './base_entity';

export type NoteModelRelations = {
  items: NoteItemRelation[];
  users: NoteUserRelation[];
};

export class NoteEntity extends BaseEntity<Note> {
  protected logger = Logger.of(NoteEntity);
  protected repository = new NoteRepository();

  protected relations: Partial<NoteModelRelations> = {};

  public async export(requestor?: UserID) {
    const relatedUsers = this.relations.users;
    const relatedUserIds = relatedUsers?.map((x) => x.id());

    if (requestor && !relatedUserIds?.includes(requestor)) {
      throw new LyfError('User tried to load an item they should not have access to', 401);
    } else {
      return {
        ...this.baseEntity!,
        relations: await this.recurseRelations<EntitySubgraph>(CommandType.Export)
      };
    }
  }
}
