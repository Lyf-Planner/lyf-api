import express from "express";
import { NoteHandlers } from "./noteHandlers";

export class NoteEndpoints extends NoteHandlers {
  constructor(server: express.Application) {
    super();
    server.post("/createNote", this.createNote);
    server.post("/updateNote", this.updateNote);
    server.post("/deleteNote", this.deleteNote);
    server.get("/getNote", this.getNote);
    server.get("/getNotes", this.getNotes);

    // server.post("/addressNoteInvite");
    // server.post("/inviteNoteUser");
  }
}
