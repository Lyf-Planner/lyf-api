import { Request, Response } from 'express';

import { ID, Identifiable } from '../../../schema/database/abstract';
import { NoteDbObject } from '../../../schema/database/notes';
import { NoteService } from '../../services/entity/note_service';
import { Logger } from '../../utils/logging';
import { getMiddlewareVars } from '../utils';
import { UserRelatedNote } from '../../../schema/user';
import { LyfError } from '../../utils/lyf_error';
import { SocialUpdate } from '../../services/relation/_social_service';
import { SocialNoteService } from '../../services/relation/social_note_service';

export class NoteHandlers {
  protected async createNote(req: Request, res: Response) {
    const noteInput = req.body as NoteDbObject & { parent_id: ID };
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Creating note ${noteInput.title} from user ${user_id}`);

    try {
      const note = await new NoteService().processCreation(noteInput, user_id, noteInput.parent_id);

      const result = await note.export(user_id);
      res.status(201).json(result).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async updateNote(req: Request, res: Response) {
    const noteChanges = req.body as Partial<UserRelatedNote> & Identifiable;
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Updating note ${noteChanges.id} from user ${user_id}`);

    try {
      const service = new NoteService();
      const note = await service.processUpdate(noteChanges.id, noteChanges, user_id);

      res.status(200).json(await note.export(user_id)).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  async updateNoteSocial(req: Request, res: Response) {
    const update = req.body as SocialUpdate;
    const fromId = getMiddlewareVars(res).user_id;

    const socialNoteService = new SocialNoteService();

    try {
      const resultingRelation = await socialNoteService.processUpdate(fromId, update);
      res.status(200).json(
        resultingRelation ? await resultingRelation.export() : null
      )
      .end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async deleteNote(req: Request, res: Response) {
    const { note_id } = req.query as { note_id: string };
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Deleting note ${note_id} as requested by ${user_id}`);

    try {
      const service = new NoteService();
      await service.processDeletion(note_id, user_id);

      res.status(204).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getNote(req: Request, res: Response) {
    const { id, include } = req.query as { id: string, include: string };
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving note ${id} for user ${user_id}`);

    try {
      const service = new NoteService();
      const note = await service.getEntity(id, user_id, include);
      res.status(200).json(await note.export(user_id)).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }

  protected async getUserNotes(req: Request, res: Response) {
    const user_id = getMiddlewareVars(res).user_id;

    logger.debug(`Retreiving notes of ${user_id}`);

    // Authorisation checks
    try {
      const service = new NoteService();
      const notes = await service.getUserNotes(user_id);

      res.status(200).json(notes).end();
    } catch (error) {
      const lyfError = error as LyfError;
      logger.error((lyfError.code || 500) + " - " + lyfError.message);
      res.status((lyfError.code || 500)).end(lyfError.message);
    }
  }
}

const logger = Logger.of(NoteHandlers);
