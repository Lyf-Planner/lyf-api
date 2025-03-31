import express from 'express';

import { NoteHandlers } from '@/controller/handlers/note_handlers';
import { API_PREFIX } from '@/controller/utils';

const ROUTE_PREFIX = `${API_PREFIX}/notes`

export class NoteEndpoints extends NoteHandlers {
  constructor(server: express.Application) {
    super();
    server.get(`${ROUTE_PREFIX}/get`, this.getNote);
    server.get(`${ROUTE_PREFIX}/delete`, this.deleteNote);
    server.get(`${ROUTE_PREFIX}/myNotes`, this.getUserNotes)

    server.post(`${ROUTE_PREFIX}/create`, this.createNote);
    server.post(`${ROUTE_PREFIX}/move`, this.moveNote);
    server.post(`${ROUTE_PREFIX}/sort`, this.sortNotes)
    server.post(`${ROUTE_PREFIX}/update`, this.updateNote);
    server.post(`${ROUTE_PREFIX}/updateSocial`, this.updateNoteSocial);
  }
}
