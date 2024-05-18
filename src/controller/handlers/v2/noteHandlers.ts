import { Request, Response } from 'express';

import { Note } from '../../api/mongo_schema/notes';
import { Permission } from '../../api/mongo_schema/social';
import { NoteModel } from '../../models/v2/notes/noteModel';
import { NoteOperations } from '../../models/v2/notes/noteOperations';
import { Logger } from '../../utils/logging';
import { getMiddlewareVars } from '../utils';

export class NoteHandlers {
  protected async createNote(req: Request, res: Response) {
    const noteInput = req.body as Note;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating note ${noteInput.title} from user ${user_id}`);

    // Instantiate
    const model = await NoteOperations.createNew(noteInput, user_id, true);

    res.status(201).json(model.getContent()).end();
  }

  protected async updateNote(req: Request, res: Response) {
    const note = req.body as Note;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Updating note ${note.title} (${note.id}) from user ${user_id}`);

    // Authorisation checks
    try {
      // These fns will check user is permitted on the note and has Permission > Viewer
      const remoteNote = await NoteOperations.retrieveForUser(note.id, user_id);
      await remoteNote.safeUpdate(note, user_id);

      res.status(200).json(remoteNote.export()).end();
    } catch (err) {
      logger.error(`User ${user_id} did not safely update note ${note.id}`);
      res.status(403).end(`${err}`);
    }
  }

  protected async deleteNote(req: Request, res: Response) {
    const { note_id } = req.query;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting note ${note_id} as requested by ${user_id}`);

    // Authorisation checks
    try {
      const note = await NoteOperations.retrieveForUser(note_id as string, user_id);
      const perm = note.requestorPermission();
      if (!perm || perm !== Permission.Owner) {
        throw new Error('Notes can only be deleted by their owner/creator');
      }

      // Perform delete
      await note!.deleteFromDb();
      res.status(204).end();
    } catch (err) {
      logger.error(`User ${user_id} tried to delete ${note_id} without valid permissions`);
      res.status(403).end(`${err}`);
    }
  }

  protected async getNote(req: Request, res: Response) {
    const { note_id } = req.body;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving note ${note_id} for user ${user_id}`);

    // Authorisation checks
    try {
      const note = await NoteOperations.retrieveForUser(note_id, user_id);
      res.status(200).json(note!.getContent()).end();
    } catch (err) {
      logger.error(`User ${user_id} requested item ${note_id} to which they don't have access`);
      res.status(403).end(`${err}`);
    }
  }

  protected async getNotes(req: Request, res: Response) {
    const { note_ids } = req.body;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving ${note_ids.length} notes for user ${user_id}`);

    // No auth checks - automatically excludes those without perms
    const items = await NoteOperations.getRawUserNotes(note_ids, user_id, true);
    logger.debug(`Got ${items.length} notes for user`);

    res.status(200).json(items!).end();
  }
}

const logger = Logger.of(NoteHandlers);
