import { EntitySubgraph } from '../../../api/schema';
import { ID } from '../../../api/schema/database/abstract';
import { NoteDbObject } from '../../../api/schema/database/notes';
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

export class NoteEntity extends BaseEntity<NoteDbObject> {
  protected logger = Logger.of(NoteEntity);
  protected repository = new NoteRepository();

  protected relations: Partial<NoteModelRelations> = {};

  public async export(requestor?: ID) {
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
