import express from 'express';

import { NoteHandlers } from '../handlers/note_handlers';
import { validate } from '../middleware/validation_middleware';
import {
  createNoteValidator,
  deleteNoteValidator,
  getNotesValidator,
  getNoteValidator,
  updateNoteValidator
} from '../validators/note_validators';

export class NoteEndpoints extends NoteHandlers {
  constructor(server: express.Application) {
    super();
    server.post('/createNote', validate(createNoteValidator), this.createNote);
    server.post('/updateNote', validate(updateNoteValidator), this.updateNote);
    server.get('/getNote', validate(getNoteValidator), this.getNote);
    server.get('/deleteNote', validate(deleteNoteValidator), this.deleteNote);

    // server.post("/addressNoteInvite");
    // server.post("/inviteNoteUser");
  }
}
