import express from "express";

export class NoteEndpoints {
  constructor(server: express.Application) {
    server.post("/createNote");
    server.post("/updateNote");
    server.post("/deleteNote");
    server.get("/getNotes");
  }
}
