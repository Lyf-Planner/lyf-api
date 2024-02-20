import { Note } from "../../api/notes";
import { ID } from "../../api/abstract";
import { NoteModel } from "./noteModel";
import { Logger } from "../../utils/logging";
import db from "../../repository/dbAccess";

export class NoteOperations {
  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true
  ): Promise<NoteModel> {
    var result = await db.notesCollection().getById(id);
    var note = new NoteModel(result as Note, true, user_id);

    var permitted = !checkPermissions || !!note.getUserPermission(user_id);

    if (!permitted)
      throw new Error(`User ${user_id} is not permitted to access item ${id}`);
    else {
      return note;
    }
  }

  // Builder method
  static async createNew(
    noteInput: Note,
    user_id: string,
    commit = false // Also create in db
  ): Promise<NoteModel> {
    var model = new NoteModel(noteInput, false, user_id);
    if (commit) await model.commit();

    return model;
  }

  static async getRawUserNotes(
    ids: ID[],
    user_id: string,
    validate_access = true
  ): Promise<Note[]> {
    var results = await db.notesCollection().getManyById(ids, false);
    var filteredResults = results
      .map((x) => new NoteModel(x as Note, true, user_id))
      .filter((x) => !validate_access || !!x.getUserPermission(user_id));

    if (filteredResults.length !== results.length) {
      let logger = Logger.of(NoteModel);
      logger.warn(
        `User no longer has access to ${
          results.length - filteredResults.length
        } notes`
      );
    }

    return filteredResults.map((x) => x.export());
  }
}
