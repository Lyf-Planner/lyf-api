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
    server.post('/note/create', this.createNote);
    server.post('/note/update', this.updateNote);
    server.get('/note/get', this.getNote);
    server.get('/note/delete', this.deleteNote);

    // server.post("/addressNoteInvite");
    // server.post("/inviteNoteUser");
  }
}
