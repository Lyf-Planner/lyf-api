import express from 'express';

import { NoteHandlers } from '../handlers/v2/noteHandlers';
import { validate } from '../middleware/validationMiddleware';
import {
  createNoteValidator,
  deleteNoteValidator,
  getNotesValidator,
  getNoteValidator,
  updateNoteValidator
} from '../validators/noteValidators';

export class NoteEndpoints extends NoteHandlers {
  constructor(server: express.Application) {
    super();
    server.post('/createNote', validate(createNoteValidator), this.createNote);
    server.post('/updateNote', validate(updateNoteValidator), this.updateNote);
    server.post('/getNotes', validate(getNotesValidator), this.getNotes);
    server.get('/getNote', validate(getNoteValidator), this.getNote);
    server.get('/deleteNote', validate(deleteNoteValidator), this.deleteNote);

    // server.post("/addressNoteInvite");
    // server.post("/inviteNoteUser");
  }
}
