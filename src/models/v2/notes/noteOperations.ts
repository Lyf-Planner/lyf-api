import { ID } from '../../../api/mongo_schema/abstract';
import { Note } from '../../../api/mongo_schema/notes';
import db from '../../../db/mongo/mongo_db';
import { Logger } from '../../../utils/logging';
import { NoteModel } from './noteModel';

export class NoteOperations {
  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true
  ): Promise<NoteModel> {
    const result = await db.notesCollection().getById(id);
    const note = new NoteModel(result as Note, true, user_id);

    const permitted = !checkPermissions || !!note.getUserPermission(user_id);

    if (!permitted) {
      throw new Error(`User ${user_id} is not permitted to access item ${id}`);
    } else {
      return note;
    }
  }

  // Builder method
  static async createNew(
    noteInput: Note,
    user_id: string,
    commit = false // Also create in db
  ): Promise<NoteModel> {
    const model = new NoteModel(noteInput, false, user_id);
    if (commit) {
      await model.commit();
    }

    return model;
  }

  static async getRawUserNotes(
    ids: ID[],
    user_id: string,
    validate_access = true
  ): Promise<Note[]> {
    const results = await db.notesCollection().getManyById(ids, false);
    const filteredResults = results
      .map((x) => new NoteModel(x as Note, true, user_id))
      .filter((x) => !validate_access || !!x.getUserPermission(user_id));

    if (filteredResults.length !== results.length) {
      const logger = Logger.of(NoteModel);
      logger.warn(`User no longer has access to ${results.length - filteredResults.length} notes`);
    }

    return filteredResults.map((x) => x.export());
  }
}
