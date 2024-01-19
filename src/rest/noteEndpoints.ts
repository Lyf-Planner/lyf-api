import { NoteHandlers } from "./noteHandlers";
import express from "express";

export class NoteEndpoints extends NoteHandlers {
  constructor(server: express.Application) {
    super();
    server.post("/createNote", this.createNote);
    server.post("/updateNote", this.updateNote);
    server.post("/getNotes", this.getNotes);
    server.get("/getNote", this.getNote);
    server.get("/deleteNote", this.deleteNote);

    // server.post("/addressNoteInvite");
    // server.post("/inviteNoteUser");
  }
}
