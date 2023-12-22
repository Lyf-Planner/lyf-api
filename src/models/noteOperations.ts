import { ObjectId } from "mongodb";
import { Note, NoteInput, NoteType } from "../api/notes";
import { ID, Permission, Time } from "../api/abstract";
import { NoteModel } from "./noteModel";
import { RestrictedRemoteObject } from "./abstract/restrictedRemoteObject";
import db from "../repository/dbAccess";
import { Logger } from "../utils/logging";
import { v4 as uuid } from "uuid";

export class NoteOperations {
  // Builder method
  static async retrieveForUser(
    id: ID,
    user_id: string,
    checkPermissions = true
  ): Promise<NoteModel> {
    var result = await db.notesCollection().getById(id);
    var permitted =
      !checkPermissions ||
      !!RestrictedRemoteObject.getUserPermission(
        result?.permitted_users!,
        user_id
      );

    if (!permitted)
      throw new Error(`User ${user_id} is not permitted to access item ${id}`);
    else {
      return new NoteModel(result as Note, true, user_id);
    }
  }

  // Builder method
  static async createNew(
    noteInput: NoteInput,
    user_id: string,
    commit = false // Also create in db
  ): Promise<NoteModel> {
    var note = noteInput as any;
    note.id = uuid();
    note.permitted_users = [{ user_id, permissions: Permission.Owner }];
    note.content = note.type === NoteType.List ? [] : "";
    note = note as Note;

    var model = new NoteModel(note, false, user_id);
    if (commit) await model.commit(true);

    return model;
  }

  static async getRawUserNotes(
    ids: ID[],
    user_id: string,
    validate_access = true
  ): Promise<Note[]> {
    var results = await db.notesCollection().getManyById(ids, false);
    var filteredResults = results.filter(
      (x) =>
        !validate_access ||
        !!RestrictedRemoteObject.getUserPermission(x.permitted_users, user_id)
    );

    if (filteredResults.length !== results.length) {
      let logger = Logger.of(NoteModel);
      logger.warn(
        `User no longer has access to ${
          results.length - filteredResults.length
        } notes`
      );
    }

    return filteredResults;
  }

  static permissionsField(note: Note) {
    return note.permitted_users;
  }
}
