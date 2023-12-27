import { Permission } from "../api/abstract";
import { Note, NoteInput } from "../api/notes";
import authUtils from "../auth/authUtils";
import { NoteModel } from "../models/noteModel";
import { NoteOperations } from "../models/noteOperations";
import { Logger } from "../utils/logging";
import { Request, Response } from "express";

export class NoteHandlers {
  private logger = Logger.of(NoteHandlers);

  protected async createNote(req: Request, res: Response) {
    // Users only type a name in a section (implying type) to create an item
    // Should reevaluate this if we ever grant API access!
    var noteInput = req.body as NoteInput;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Should validate item input here!

    // Instantiate
    var model = await NoteOperations.createNew(noteInput, user_id, true);

    res.status(200).json(model.getContent()).end();
  }

  protected async updateNote(req: Request, res: Response) {
    var note = req.body as Note;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    var remoteItem: NoteModel;

    // Authorisation checks
    try {
      // These fns will check user is permitted on the note and has Permission > Viewer
      remoteItem = await NoteOperations.retrieveForUser(note.id, user_id);
      await remoteItem.safeUpdate(note, user_id);
    } catch (err) {
      res.send(403).end(`${err}`);
      return;
    }

    res.send(200).end();
  }

  protected async deleteNote(req: Request, res: Response) {
    var { note_id } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var note: NoteModel;
    try {
      var note = await NoteOperations.retrieveForUser(note_id, user_id);
      var perm = note.requestorPermission();
      if (!perm || perm !== Permission.Owner)
        throw new Error(`Notes can only be deleted by their owner/creator`);
    } catch (err) {
      res.status(403).end(`${err}`);
    }

    // Perform delete
    await note!.deleteFromDb();
    res.status(200).end();
  }

  protected async getNote(req: Request, res: Response) {
    var { note_id } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // Authorisation checks
    var note: NoteModel;
    try {
      note = await NoteOperations.retrieveForUser(note_id, user_id);
    } catch (err) {
      res.status(403).end(`${err}`);
    }

    res.status(200).json(note!.getContent()).end();
  }

  protected async getNotes(req: Request, res: Response) {
    var { note_ids } = req.body;
    var user_id = authUtils.authoriseHeader(req, res);
    if (!user_id) return;

    // No auth checks - automatically excludes those without perms
    var items = await NoteOperations.getRawUserNotes(note_ids, user_id, true);

    res.status(200).json(items!).end();
  }
}
