import { Permission } from "../../api/abstract";
import { Note } from "../../api/notes";
import { NoteModel } from "../../models/noteModel";
import { NoteOperations } from "../../models/noteOperations";
import { Logger } from "../../utils/logging";
import { Request, Response } from "express";
import { getMiddlewareVars } from "../utils";

export class NoteHandlers {
  private logger = Logger.of(NoteHandlers);

  protected async createNote(req: Request, res: Response) {
    var noteInput = req.body as Note;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating note ${noteInput.title} from user ${user_id}`);

    // Instantiate
    var model = await NoteOperations.createNew(noteInput, user_id, true);

    res.status(200).json(model.getContent()).end();
  }

  protected async updateNote(req: Request, res: Response) {
    var note = req.body as Note;
    var user_id = getMiddlewareVars(res).user_id;

    var remoteItem: NoteModel;

    logger.debug(
      `Updating note ${note.title} (${note.id}) from user ${user_id}`
    );

    // Authorisation checks
    try {
      // These fns will check user is permitted on the note and has Permission > Viewer
      remoteItem = await NoteOperations.retrieveForUser(note.id, user_id);
      await remoteItem.safeUpdate(note, user_id);
    } catch (err) {
      logger.error(`User ${user_id} did not safely update note ${note.id}`);
      res.status(403).end(`${err}`);
      return;
    }

    res.status(200).end();
  }

  protected async deleteNote(req: Request, res: Response) {
    var { note_id } = req.query;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting note ${note_id} as requested by ${user_id}`);

    // Authorisation checks
    var note: NoteModel;
    try {
      var note = await NoteOperations.retrieveForUser(
        note_id as string,
        user_id
      );
      var perm = note.requestorPermission();
      if (!perm || perm !== Permission.Owner)
        throw new Error(`Notes can only be deleted by their owner/creator`);
    } catch (err) {
      logger.error(
        `User ${user_id} tried to delete ${note_id} without valid permissions`
      );
      res.status(403).end(`${err}`);
    }

    // Perform delete
    await note!.deleteFromDb();
    res.status(200).end();
  }

  protected async getNote(req: Request, res: Response) {
    var { note_id } = req.body;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving note ${note_id} for user ${user_id}`);

    // Authorisation checks
    var note: NoteModel;
    try {
      note = await NoteOperations.retrieveForUser(note_id, user_id);
    } catch (err) {
      logger.error(
        `User ${user_id} requested item ${note_id} to which they don't have access`
      );
      res.status(403).end(`${err}`);
    }

    res.status(200).json(note!.getContent()).end();
  }

  protected async getNotes(req: Request, res: Response) {
    var { note_ids } = req.body;
    var user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving ${note_ids.length} notes for user ${user_id}`);

    // No auth checks - automatically excludes those without perms
    var items = await NoteOperations.getRawUserNotes(note_ids, user_id, true);
    logger.debug(`Got ${items.length} notes for user`);

    res.status(200).json(items!).end();
  }
}

const logger = Logger.of(NoteHandlers);
