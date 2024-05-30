import { Request, Response } from 'express';

import { Identifiable } from '../../../api/schema/database/abstract';
import { NoteDbObject } from '../../../api/schema/database/notes';
import { NoteService } from '../../../services/entity/note_service';
import { Logger } from '../../../utils/logging';
import { getMiddlewareVars } from '../../utils';

export class NoteHandlers {
  protected async createNote(req: Request, res: Response) {
    const noteInput = req.body as NoteDbObject;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating note ${noteInput.title} from user ${user_id}`);

    const service = new NoteService();
    const note = await service.processCreation(noteInput, user_id);

    res.status(201).json(await note.export(user_id)).end();
  }

  protected async updateNote(req: Request, res: Response) {
    const noteChanges = req.body as Partial<NoteDbObject> & Identifiable;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Updating note ${noteChanges.id} from user ${user_id}`);

    try {
      const service = new NoteService();
      const note = await service.processUpdate(noteChanges.id, noteChanges, user_id);

      res.status(200).json(await note.export()).end();
    } catch (err) {
      logger.error(`User ${user_id} did not safely update note ${noteChanges.id}`);
      res.status(403).end(`${err}`);
    }
  }

  protected async deleteNote(req: Request, res: Response) {
    const { note_id } = req.query;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting note ${note_id} as requested by ${user_id}`);

    try {
      const service = new NoteService();
      await service.processDeletion(note_id as string, user_id);

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

    try {
      const service = new NoteService();
      const note = await service.getEntity(note_id, user_id);
      res.status(200).json(await note.export(user_id)).end();
    } catch (err) {
      logger.error(`User ${user_id} requested item ${note_id} to which they don't have access`);
      res.status(403).end(`${err}`);
    }
  }
}

const logger = Logger.of(NoteHandlers);
