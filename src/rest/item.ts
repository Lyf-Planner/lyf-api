import express from "express";

export class ItemEndpoints {
  constructor(server: express.Application) {
    server.post("/createItem");
    server.post("/updateItem");
    server.post("/deleteItem");
    server.get("/getItems");
  }
}
