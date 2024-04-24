import { ID } from '../api/schema/database/abstract';
import { ItemNoteRelationshipModel } from '../models/item_note_model';
import { ItemNoteRepository } from '../repository/item_note_repository';
import { Logger } from '../utils/logging';

export class ItemNoteService {
  protected repository: ItemNoteRepository;
  private logger = Logger.of(ItemNoteService);
  protected modelFactory = (item_user: ItemNoteRelationship) =>
    new ItemNoteRelationshipModel(item_user)

  constructor() {
    super();
    this.repository = new ItemNoteRepository();
  }

  public async initialiseItemOnNote(item_id: ID, note_id: ID) {
    const creationDate = new Date();

    const itemNoteRelationship = {
      created: creationDate,
      last_updated: creationDate,
      note_id_fk: note_id,
      item_id_fk: item_id
    };

    await this.createNew(itemNoteRelationship);
  }
}
