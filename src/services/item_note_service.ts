import { ID } from '../api/schema/database/abstract';
import { ItemNoteRelationshipDbObject } from '../api/schema/database/items_on_notes';
import { ItemEntity } from '../models/v3/entity/item_entity';
import { NoteItemRelation } from '../models/v3/relation/note_related_item';
import { ItemNoteRepository } from '../repository/item_note_repository';
import { Logger } from '../utils/logging';
import { RelationService } from './abstract/relation_service';

export class ItemNoteService extends RelationService<ItemNoteRelationshipDbObject> {
  protected repository: ItemNoteRepository;
  private logger = Logger.of(ItemNoteService);

  constructor() {
    super();
    this.repository = new ItemNoteRepository();
  }

  public async initialiseItemOnNote(item: ItemEntity, note_id: ID) {
    const creationDate = new Date();

    const itemNoteRelationship = {
      created: creationDate,
      last_updated: creationDate,
      note_id_fk: note_id,
      item_id_fk: item.id()
    };

    const relationshipDbObject = await this.repository.create(itemNoteRelationship);
    return new NoteItemRelation({ ...item.get(), ...relationshipDbObject }, 'n/a');
  }
}
